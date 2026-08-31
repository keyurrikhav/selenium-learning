const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");


// --------------------------------------------------
// CONFIG — put your details here
// --------------------------------------------------

const PROXY_CONFIG = {
    host: "your-proxy-host.com",   // <-- replace with your proxy's host
    port: "8080",                   // <-- replace with your proxy's port
    username: "",                   // leave "" if your proxy has no auth
    password: ""                    // leave "" if your proxy has no auth
};

const START_URL =
    "https://www.goodfirms.co/directory/languages/top-software-development-companies";

const MAX_PAGES = 50; // safety cap so it can't loop forever



// --------------------------------------------------
// Build a Chrome extension on the fly for proxy auth
// (only needed if PROXY_CONFIG.username is set)
// --------------------------------------------------
function createProxyAuthExtension(host, port, username, password) {

    const manifest = {
        manifest_version: 2,
        name: "Proxy Auth",
        version: "1.0.0",
        permissions: [
            "proxy",
            "tabs",
            "unlimitedStorage",
            "storage",
            "<all_urls>",
            "webRequest",
            "webRequestBlocking"
        ],
        background: {
            scripts: ["background.js"]
        }
    };

    const background = `
        var config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: "http",
                    host: "${host}",
                    port: parseInt(${port})
                },
                bypassList: ["localhost"]
            }
        };

        chrome.proxy.settings.set(
            { value: config, scope: "regular" },
            function () {}
        );

        chrome.webRequest.onAuthRequired.addListener(
            function (details) {
                return {
                    authCredentials: {
                        username: "${username}",
                        password: "${password}"
                    }
                };
            },
            { urls: ["<all_urls>"] },
            ["blocking"]
        );
    `;

    const extDir = path.join(__dirname, "proxy_auth_ext");

    if (!fs.existsSync(extDir)) {
        fs.mkdirSync(extDir);
    }

    fs.writeFileSync(
        path.join(extDir, "manifest.json"),
        JSON.stringify(manifest)
    );

    fs.writeFileSync(
        path.join(extDir, "background.js"),
        background
    );

    return extDir;
}



// --------------------------------------------------
// Create the Chrome driver, with proxy + stealth options
// --------------------------------------------------
async function createDriver() {

    const options = new chrome.Options();

    // Basic stealth flags
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.excludeSwitches("enable-automation");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--no-sandbox");
    options.addArguments(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    // Proxy setup — only if host is filled in
    if (PROXY_CONFIG.host && PROXY_CONFIG.host !== "your-proxy-host.com") {

        if (PROXY_CONFIG.username) {

            // Proxy with username/password
            const extDir = createProxyAuthExtension(
                PROXY_CONFIG.host,
                PROXY_CONFIG.port,
                PROXY_CONFIG.username,
                PROXY_CONFIG.password
            );

            options.addArguments(`--load-extension=${extDir}`);

        } else {

            // Proxy with no auth
            options.addArguments(
                `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`
            );
        }

    } else {

        console.log(
            "No proxy configured — running without a proxy. " +
            "Fill in PROXY_CONFIG at the top of the file to use one."
        );
    }

    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    // Hide the webdriver flag
    await driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    `);

    return driver;
}



// --------------------------------------------------
// Scrape companies from the current page
// --------------------------------------------------
async function scrapeCurrentPage(driver) {

    const companies = await driver.findElements(
        By.css("li.firm-wrapper")
    );

    const pageData = [];

    for (const company of companies) {

        let companyName = "";
        let size = "";
        let location = "";
        let url = "";

        try {
            companyName = await company
                .findElement(By.css("h3.firm-name a"))
                .getText();
        } catch (e) {}

        try {
            size = await company
                .findElement(By.css(".firm-employees span"))
                .getText();
        } catch (e) {}

        try {
            location = await company
                .findElement(By.css(".firm-location span"))
                .getText();
        } catch (e) {}

        try {
            url = await company
                .findElement(By.css(".firm-urls a"))
                .getAttribute("href");
        } catch (e) {}

        pageData.push({
            companyName: companyName.trim(),
            size: size.trim(),
            location: location.trim(),
            url: url.trim()
        });
    }

    return pageData;
}



// --------------------------------------------------
// Get the URL of the next page
// --------------------------------------------------
async function getNextPageUrl(driver) {

    const nextButtons = await driver.findElements(
        By.css("li.next-page a")
    );

    if (nextButtons.length === 0) {
        return null;
    }

    const relativeUrl = await nextButtons[0].getAttribute("href");
    const currentUrl = await driver.getCurrentUrl();

    const nextUrl = new URL(relativeUrl, currentUrl).href;

    return nextUrl;
}



// --------------------------------------------------
// Small helper: random delay so requests don't look robotic
// --------------------------------------------------
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(minMs, maxMs) {
    return minMs + Math.random() * (maxMs - minMs);
}



// --------------------------------------------------
// Main scraper
// --------------------------------------------------
async function scrapeCompanies() {

    const driver = await createDriver();

    const allCompanies = [];

    try {

        let currentUrl = START_URL;
        let pageCount = 0;

        while (currentUrl && pageCount < MAX_PAGES) {

            pageCount++;

            console.log("\n----------------------------------------");
            console.log(`Page ${pageCount} — Scraping:`, currentUrl);

            await driver.get(currentUrl);

            console.log("Current URL:", await driver.getCurrentUrl());
            console.log("Page title:", await driver.getTitle());

            // Debug screenshot for each page (overwrites each time)
            const image = await driver.takeScreenshot();
            fs.writeFileSync("debug-page.png", image, "base64");

            // If Cloudflare (or similar) challenge shows up, this wait
            // will time out — catch it so the whole run doesn't die
            try {
                await driver.wait(
                    until.elementLocated(By.css("li.firm-wrapper")),
                    30000
                );
            } catch (e) {
                console.log(
                    "Company cards never appeared — likely blocked by a " +
                    "security check. Check debug-page.png. Stopping here."
                );
                break;
            }

            const pageData = await scrapeCurrentPage(driver);
            allCompanies.push(...pageData);

            console.log("Companies on this page:", pageData.length);
            console.log("Total companies so far:", allCompanies.length);

            currentUrl = await getNextPageUrl(driver);

            // Randomized delay before hitting the next page
            const delay = randomDelay(2000, 5000);
            console.log(`Waiting ${Math.round(delay)}ms before next page...`);
            await sleep(delay);
        }

        console.log("\n========================================");
        console.log("Finished scraping!");
        console.log("Total companies:", allCompanies.length);
        console.log("========================================");

        // Save results to a JSON file
        fs.writeFileSync(
            "companies.json",
            JSON.stringify(allCompanies, null, 2)
        );

        console.log("Saved results to companies.json");

    } finally {

        await driver.quit();
    }
}



// --------------------------------------------------
// Start scraper
// --------------------------------------------------
scrapeCompanies();