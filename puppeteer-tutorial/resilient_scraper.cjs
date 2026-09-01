const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());


// ==================================================
// CONFIGURATION
// ==================================================

const BASE_URL =
    "https://www.goodfirms.co/directory/languages/top-software-development-companies";

const START_PAGE = 1;
const END_PAGE = 493;

const DATA_DIR = "data";
const PROGRESS_FILE = "progress.json";
const FAILED_PAGES_FILE = "failed-pages.json";

// Restart the whole browser after this many pages —
// clears memory buildup and rotates to the next proxy
const RESTART_BROWSER_EVERY = 15;

// How many times to wait-and-retry if a challenge/error
// appears before giving up on that page and moving on
const MAX_RETRIES_PER_PAGE = 3;

// How long to wait for a challenge to clear (gives you
// time to solve it manually if it's an interactive one)
const CHALLENGE_WAIT_MS = 30000;


// --------------------------------------------------
// PROXY LIST — fill in real proxies here to rotate IPs.
// Leave empty [] to run without a proxy.
// Format: "http://username:password@host:port"
// or "http://host:port" if the proxy has no auth
// --------------------------------------------------

const PROXIES = [
    // "http://user1:pass1@proxy1.example.com:8000",
    // "http://user2:pass2@proxy2.example.com:8000",
    // "http://proxy3.example.com:8000",
];


// ==================================================
// PROGRESS TRACKING (so a crash never loses your work)
// ==================================================

function loadProgress() {

    if (fs.existsSync(PROGRESS_FILE)) {

        const raw = fs.readFileSync(PROGRESS_FILE, "utf8");
        return JSON.parse(raw);
    }

    return { lastCompletedPage: START_PAGE - 1 };
}


function saveProgress(lastCompletedPage) {

    fs.writeFileSync(
        PROGRESS_FILE,
        JSON.stringify({ lastCompletedPage }, null, 2),
        "utf8"
    );
}


function loadFailedPages() {

    if (fs.existsSync(FAILED_PAGES_FILE)) {

        const raw = fs.readFileSync(FAILED_PAGES_FILE, "utf8");
        return JSON.parse(raw);
    }

    return [];
}


function saveFailedPages(failedPages) {

    fs.writeFileSync(
        FAILED_PAGES_FILE,
        JSON.stringify(failedPages, null, 2),
        "utf8"
    );
}



// ==================================================
// PROXY ROTATION
// ==================================================

let proxyIndex = 0;

function getNextProxy() {

    if (PROXIES.length === 0) {
        return null;
    }

    const proxy = PROXIES[proxyIndex % PROXIES.length];
    proxyIndex++;

    return proxy;
}


// Parse "http://user:pass@host:port" into pieces,
// since Puppeteer needs the host:port separate from
// the username/password
function parseProxy(proxyUrl) {

    const url = new URL(proxyUrl);

    return {
        server: `${url.protocol}//${url.host}`,
        username: url.username || null,
        password: url.password || null
    };
}



// ==================================================
// BROWSER LAUNCH (with optional proxy)
// ==================================================

async function launchBrowser() {

    const proxyUrl = getNextProxy();

    const launchArgs = [
        "--disable-blink-features=AutomationControlled"
    ];

    let proxyInfo = null;

    if (proxyUrl) {

        proxyInfo = parseProxy(proxyUrl);
        launchArgs.push(`--proxy-server=${proxyInfo.server}`);

        console.log("Using proxy:", proxyInfo.server);

    } else {

        console.log("No proxy configured — running without one.");
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: launchArgs
    });

    const page = await browser.newPage();

    // If the proxy needs a username/password, Puppeteer
    // handles it directly — no extension hack needed
    if (proxyInfo && proxyInfo.username) {

        await page.authenticate({
            username: proxyInfo.username,
            password: proxyInfo.password
        });
    }

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 850 });

    return { browser, page };
}



// ==================================================
// SCRAPE CURRENT PAGE
// ==================================================

async function scrapeCurrentPage(page) {

    const pageData = await page.evaluate(() => {

        const cards = document.querySelectorAll("li.firm-wrapper");
        const results = [];

        cards.forEach((card) => {

            try {

                const nameEl = card.querySelector("h3.firm-name a");
                const companyName = nameEl ? nameEl.textContent : "";

                const sizeEl = card.querySelector(".firm-employees span");
                const size = sizeEl ? sizeEl.textContent : "";

                const locationEl = card.querySelector(".firm-location span");
                const location = locationEl ? locationEl.textContent : "";

                const urlEl = card.querySelector(".firm-urls a");
                const url = urlEl ? urlEl.getAttribute("href") : "";

                results.push({
                    companyName: companyName ? companyName.trim() : "",
                    size: size ? size.trim() : "",
                    location: location ? location.trim() : "",
                    url: url ? url.trim() : ""
                });

            } catch (error) {
                // skip broken card
            }
        });

        return results;
    });

    return pageData;
}



// ==================================================
// CHECK IF THE CHALLENGE PAGE IS SHOWING
// ==================================================

async function isChallengePage(page) {

    const title = await page.title();

    const bodyText = await page.evaluate(
        () => document.body.innerText
    );

    return (
        bodyText.includes("Performing security verification") ||
        bodyText.includes("Verify you are human") ||
        title.includes("Just a moment")
    );
}



// ==================================================
// SCRAPE ONE PAGE, WITH RETRY-ON-CHALLENGE
// ==================================================

async function scrapePageWithRetries(page, url, pageNumber) {

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_PAGE; attempt++) {

        console.log(`\nPage ${pageNumber} — attempt ${attempt}`);
        console.log("Opening:", url);

        try {

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });

        } catch (error) {

            console.log("Navigation error:", error.message);
            console.log("Waiting 15s before retrying...");
            await sleep(15000);
            continue;
        }

        const challenged = await isChallengePage(page);

        if (challenged) {

            console.log(
                `Challenge detected. Waiting ${CHALLENGE_WAIT_MS / 1000}s ` +
                `— solve it manually in the browser window if it needs a click.`
            );

            await sleep(CHALLENGE_WAIT_MS);

            const stillChallenged = await isChallengePage(page);

            if (stillChallenged) {

                console.log("Still blocked after waiting. Retrying...");
                continue;
            }
        }

        try {

            await page.waitForSelector("li.firm-wrapper", { timeout: 15000 });

        } catch (error) {

            console.log("Company cards never appeared. Retrying...");
            await sleep(10000);
            continue;
        }

        const pageData = await scrapeCurrentPage(page);

        if (pageData.length === 0) {

            console.log("Zero companies scraped. Retrying...");
            await sleep(10000);
            continue;
        }

        console.log(`Success — ${pageData.length} companies scraped.`);

        return pageData;
    }

    console.log(`Giving up on page ${pageNumber} after ${MAX_RETRIES_PER_PAGE} attempts.`);
    return null;
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



// ==================================================
// MAIN
// ==================================================

async function run() {

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const progress = loadProgress();
    const failedPages = loadFailedPages();

    const resumeFrom = Math.max(START_PAGE, progress.lastCompletedPage + 1);

    console.log("========================================");
    console.log(`Resuming from page ${resumeFrom} (last completed: ${progress.lastCompletedPage})`);
    console.log("========================================");

    let browserData = await launchBrowser();
    let pagesSinceRestart = 0;

    for (let pageNumber = resumeFrom; pageNumber <= END_PAGE; pageNumber++) {

        // Restart browser periodically — clears memory
        // buildup and moves to the next proxy in the list
        if (pagesSinceRestart >= RESTART_BROWSER_EVERY) {

            console.log("\nRestarting browser to clear memory / rotate proxy...");

            await browserData.browser.close();
            browserData = await launchBrowser();
            pagesSinceRestart = 0;
        }

        const url =
            pageNumber === 1
                ? BASE_URL
                : `${BASE_URL}?page=${pageNumber}`;

        let pageData = null;

        try {

            pageData = await scrapePageWithRetries(
                browserData.page,
                url,
                pageNumber
            );

        } catch (error) {

            // Catches crashed browser / disconnected target etc.
            console.log("Unexpected error on page", pageNumber, ":", error.message);

            console.log("Relaunching browser and retrying this page once...");

            try {
                await browserData.browser.close();
            } catch (e) {}

            browserData = await launchBrowser();
            pagesSinceRestart = 0;

            try {

                pageData = await scrapePageWithRetries(
                    browserData.page,
                    url,
                    pageNumber
                );

            } catch (error2) {

                console.log("Still failing after relaunch:", error2.message);
                pageData = null;
            }
        }

        if (pageData) {

            const outputFile = path.join(DATA_DIR, `page-${pageNumber}.json`);

            fs.writeFileSync(
                outputFile,
                JSON.stringify(pageData, null, 2),
                "utf8"
            );

            console.log("Saved:", outputFile);

            saveProgress(pageNumber);

        } else {

            failedPages.push(pageNumber);
            saveFailedPages(failedPages);

            console.log(`Marked page ${pageNumber} as failed. Continuing to next page.`);

            // Still mark progress so we don't loop on this
            // page forever on resume — it's tracked separately
            // in failed-pages.json for you to retry later
            saveProgress(pageNumber);
        }

        pagesSinceRestart++;

        // Polite random-ish delay between pages
        await sleep(2000 + Math.random() * 2000);
    }

    await browserData.browser.close();

    console.log("\n========================================");
    console.log("RUN COMPLETE");
    console.log("========================================");
    console.log("Last page reached:", END_PAGE);
    console.log("Failed pages:", failedPages);
    console.log("Run combine.js to merge everything in data/ into one file.");
    console.log("========================================");
}


run();
