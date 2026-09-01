import { Builder, By, until }
    from "selenium-webdriver";

import chrome from "selenium-webdriver/chrome.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// --------------------------------------------------
// PROXY CONFIG — put your proxy details here
// --------------------------------------------------

const PROXY_CONFIG = {
    host: "your-proxy-host.com",   // <-- replace with your proxy's host
    port: "8080",                   // <-- replace with your proxy's port
    username: "",                   // leave "" if your proxy has no auth
    password: ""                    // leave "" if your proxy has no auth
};


// --------------------------------------------------
// CF_CLEARANCE_COOKIE — paste the value from a real,
// non-automated Chrome after you solve the challenge
// there by hand. Leave "" to skip this.
// --------------------------------------------------

const CF_CLEARANCE_COOKIE = "";


// ==================================================
// CONFIGURATION
// ==================================================

const START_URL =
    "https://www.goodfirms.co/directory/languages/top-software-development-companies";

const OUTPUT_JSON = "companies.json";
const OUTPUT_CSV = "companies.csv";


// ==================================================
// 1. SCRAPE CURRENT PAGE
// ==================================================

async function scrapeCurrentPage(driver) {

    const companies = await driver.findElements(
        By.css("li.firm-wrapper")
    );

    const pageData = [];


    for (const company of companies) {

        try {

            // ------------------------------------------
            // Company Name
            // ------------------------------------------

            const companyName =
                await company
                    .findElement(
                        By.css("h3.firm-name a")
                    )
                    .getText();


            // ------------------------------------------
            // Company Size
            // ------------------------------------------

            const size =
                await company
                    .findElement(
                        By.css(".firm-employees span")
                    )
                    .getText();


            // ------------------------------------------
            // Location
            // ------------------------------------------

            const location =
                await company
                    .findElement(
                        By.css(".firm-location span")
                    )
                    .getText();


            // ------------------------------------------
            // Company Website
            // ------------------------------------------

            const url =
                await company
                    .findElement(
                        By.css(".firm-urls a")
                    )
                    .getAttribute("href");


            // ------------------------------------------
            // Add record
            // ------------------------------------------

            pageData.push({

                companyName:
                    companyName.trim(),

                size:
                    size.trim(),

                location:
                    location.trim(),

                url:
                    url ? url.trim() : ""

            });


        } catch (error) {

            console.log(
                "Could not extract one company:",
                error.message
            );

        }
    }


    return pageData;
}



// ==================================================
// 2. GET NEXT PAGE URL
// ==================================================

async function getNextPageUrl(driver) {

    const nextButtons =
        await driver.findElements(
            By.css("li.next-page a")
        );


    // No Next button
    // means we are probably on the last page.
    if (nextButtons.length === 0) {

        return null;

    }


    const relativeUrl =
        await nextButtons[0]
            .getAttribute("href");


    if (!relativeUrl) {

        return null;

    }


    const currentUrl =
        await driver.getCurrentUrl();


    const nextUrl =
        new URL(
            relativeUrl,
            currentUrl
        ).href;


    return nextUrl;
}



// ==================================================
// 3. CLEAN COMPANY DATA
// ==================================================

function cleanCompany(company) {

    return {

        companyName:
            String(company.companyName || "")
                .replace(/\s+/g, " ")
                .trim(),

        size:
            String(company.size || "")
                .replace(/\s+/g, " ")
                .trim(),

        location:
            String(company.location || "")
                .replace(/\s+/g, " ")
                .trim(),

        url:
            String(company.url || "")
                .trim()

    };
}



// ==================================================
// 4. VALIDATE COMPANY DATA
// ==================================================

function isValidCompany(company) {

    // Company name required
    if (!company.companyName) {

        return false;

    }


    // Size required
    if (!company.size) {

        return false;

    }


    // Location required
    if (!company.location) {

        return false;

    }


    // URL required
    if (!company.url) {

        return false;

    }


    return true;
}



// ==================================================
// 5. REMOVE DUPLICATES
// ==================================================

function removeDuplicates(companies) {

    const uniqueCompanies =
        new Map();


    for (const company of companies) {

        // Use URL as unique identifier
        const key =
            company.url.toLowerCase();


        uniqueCompanies.set(
            key,
            company
        );

    }


    return Array.from(
        uniqueCompanies.values()
    );
}



// ==================================================
// 6. SAVE JSON
// ==================================================

function saveJSON(companies) {

    fs.writeFileSync(

        OUTPUT_JSON,

        JSON.stringify(
            companies,
            null,
            2
        ),

        "utf8"

    );


    console.log(
        `JSON saved: ${OUTPUT_JSON}`
    );
}



// ==================================================
// 7. CSV ESCAPE FUNCTION
// ==================================================

function escapeCSV(value) {

    const text =
        String(value ?? "");


    // If value contains:
    // comma, quote, or newline
    // then wrap it in quotes.

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;
}



// ==================================================
// 8. SAVE CSV
// ==================================================

function saveCSV(companies) {

    const headers =
        [
            "companyName",
            "size",
            "location",
            "url"
        ];


    const rows = [

        headers.join(",")

    ];


    for (const company of companies) {

        const row = [

            escapeCSV(
                company.companyName
            ),

            escapeCSV(
                company.size
            ),

            escapeCSV(
                company.location
            ),

            escapeCSV(
                company.url
            )

        ];


        rows.push(
            row.join(",")
        );

    }


    fs.writeFileSync(

        OUTPUT_CSV,

        rows.join("\n"),

        "utf8"

    );


    console.log(
        `CSV saved: ${OUTPUT_CSV}`
    );
}



// ==================================================
// 9. PROXY + STEALTH DRIVER SETUP
// ==================================================

// Build a small Chrome extension on the fly to handle
// proxy username/password (Chrome's --proxy-server flag
// alone can't carry credentials)
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


// Build the Chrome driver, with stealth flags and an
// optional proxy wired in
async function createDriver() {

    const options = new chrome.Options();

    // Stealth flags — hide the more obvious automation signals
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.excludeSwitches("enable-automation");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--no-sandbox");
    options.addArguments(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    // Only wire in a proxy if PROXY_CONFIG.host has been filled in
    if (PROXY_CONFIG.host && PROXY_CONFIG.host !== "your-proxy-host.com") {

        if (PROXY_CONFIG.username) {

            const extDir = createProxyAuthExtension(
                PROXY_CONFIG.host,
                PROXY_CONFIG.port,
                PROXY_CONFIG.username,
                PROXY_CONFIG.password
            );

            options.addArguments(`--load-extension=${extDir}`);

        } else {

            options.addArguments(
                `--proxy-server=http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`
            );
        }

    } else {

        console.log(
            "No proxy configured — running without one. " +
            "Fill in PROXY_CONFIG at the top of the file to use a proxy."
        );
    }

    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    // Hide the webdriver flag from basic detection scripts
    await driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    `);

    return driver;
}



// ==================================================
// 10. MAIN SCRAPER
// ==================================================

async function scrapeCompanies() {

    const driver =
        await createDriver();


    // ------------------------------------------
    // Inject a Cloudflare clearance cookie, if
    // you've provided one, so Selenium starts
    // already "verified" instead of hitting the
    // challenge at all
    // ------------------------------------------

    if (CF_CLEARANCE_COOKIE) {

        console.log(
            "\nInjecting cf_clearance cookie before scraping..."
        );

        // Cookies can only be added for a domain the
        // browser has already visited, so open the
        // site once first
        await driver.get(
            "https://www.goodfirms.co"
        );

        await driver.manage().addCookie({
            name: "cf_clearance",
            value: CF_CLEARANCE_COOKIE,
            domain: ".goodfirms.co"
        });

        console.log(
            "Cookie injected."
        );

    } else {

        console.log(
            "\nNo cf_clearance cookie provided — running without it. " +
            "See CF_CLEARANCE_COOKIE at the top of the file."
        );
    }


    try {

        // ------------------------------------------
        // Starting URL
        // ------------------------------------------

        let currentUrl =
            START_URL;


        // ------------------------------------------
        // Store every scraped record
        // ------------------------------------------

        const allCompanies = [];


        // ------------------------------------------
        // Track pages
        // ------------------------------------------

        let pageNumber = 1;


        // ------------------------------------------
        // Pagination loop
        // ------------------------------------------

        while (currentUrl) {

            console.log(
                "\n========================================"
            );

            console.log(
                `PAGE ${pageNumber}`
            );

            console.log(
                "========================================"
            );

            console.log(
                "Scraping:",
                currentUrl
            );


            // --------------------------------------
            // Open current page
            // --------------------------------------

            await driver.get(
                currentUrl
            );


            // --------------------------------------
            // Let the page settle before reading it
            // --------------------------------------

            await driver.sleep(2000);


            // --------------------------------------
            // Check actual URL
            // --------------------------------------

            const actualUrl =
                await driver.getCurrentUrl();


            console.log(
                "Current URL:",
                actualUrl
            );


            // --------------------------------------
            // Check page title
            // --------------------------------------

            const title =
                await driver.getTitle();


            console.log(
                "Page title:",
                title
            );


            // --------------------------------------
            // Get body text
            // --------------------------------------

            const body =
                await driver
                    .findElement(
                        By.tagName("body")
                    )
                    .getText();


            // --------------------------------------
            // Detect verification page
            // --------------------------------------

            if (
                body.includes(
                    "Performing security verification"
                ) ||
                body.includes(
                    "Are you human"
                ) ||
                title.includes(
                    "Just a moment"
                )
            ) {

                console.log(
                    "\n⚠ Security verification detected on this page."
                );

                console.log(
                    "Please complete it manually in the Chrome window now."
                );

                console.log(
                    "Waiting up to 3 minutes for it to clear..."
                );
            }


            // --------------------------------------
            // Wait for company cards
            // (normal wait is 30s; if a verification
            // screen was showing, this same wait is
            // extended to 3 minutes so you have time
            // to solve it by hand)
            // --------------------------------------

            const cardWaitMs =
                (
                    body.includes("Performing security verification") ||
                    body.includes("Are you human") ||
                    title.includes("Just a moment")
                )
                    ? 180000   // 3 minutes — manual verification case
                    : 30000;   // normal case

            try {

                await driver.wait(

                    until.elementLocated(

                        By.css(
                            "li.firm-wrapper"
                        )

                    ),

                    cardWaitMs

                );

                console.log(
                    "Company cards found — continuing."
                );

            } catch (error) {

                console.log(
                    "\nCompany cards were not found even after waiting."
                );

                console.log(
                    "Stopping scraper."
                );

                break;
            }


            // --------------------------------------
            // Scrape current page
            // --------------------------------------

            const pageData =
                await scrapeCurrentPage(
                    driver
                );


            console.log(
                "Companies on this page:",
                pageData.length
            );


            // --------------------------------------
            // Add to main array
            // --------------------------------------

            allCompanies.push(
                ...pageData
            );


            console.log(
                "Raw total:",
                allCompanies.length
            );


            // --------------------------------------
            // Save progress after every page, so a
            // later failure doesn't lose everything
            // already collected
            // --------------------------------------

            fs.writeFileSync(
                "companies-progress.json",
                JSON.stringify(allCompanies, null, 2),
                "utf8"
            );

            console.log(
                "Progress saved: companies-progress.json"
            );


            // --------------------------------------
            // Get next page
            // --------------------------------------

            currentUrl =
                await getNextPageUrl(
                    driver
                );


            // --------------------------------------
            // Next page number
            // --------------------------------------

            if (currentUrl) {

                pageNumber++;

            }

        }


        // ==================================================
        // DATA PROCESSING
        // ==================================================

        console.log(
            "\n\n========================================"
        );

        console.log(
            "DATA PROCESSING"
        );

        console.log(
            "========================================"
        );


        // ------------------------------------------
        // Step 1: Clean
        // ------------------------------------------

        const cleanedCompanies =
            allCompanies.map(
                cleanCompany
            );


        console.log(
            "After cleaning:",
            cleanedCompanies.length
        );


        // ------------------------------------------
        // Step 2: Validate
        // ------------------------------------------

        const validCompanies =
            cleanedCompanies.filter(
                isValidCompany
            );


        console.log(
            "Valid companies:",
            validCompanies.length
        );


        // ------------------------------------------
        // Step 3: Remove duplicates
        // ------------------------------------------

        const uniqueCompanies =
            removeDuplicates(
                validCompanies
            );


        console.log(
            "Unique companies:",
            uniqueCompanies.length
        );


        // ==================================================
        // SAVE DATA
        // ==================================================

        console.log(
            "\n\n========================================"
        );

        console.log(
            "SAVING DATA"
        );

        console.log(
            "========================================"
        );


        // Save JSON
        saveJSON(
            uniqueCompanies
        );


        // Save CSV
        saveCSV(
            uniqueCompanies
        );


        // ==================================================
        // FINAL SUMMARY
        // ==================================================

        console.log(
            "\n\n========================================"
        );

        console.log(
            "SCRAPING COMPLETE"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Raw records:",
            allCompanies.length
        );

        console.log(
            "Valid records:",
            validCompanies.length
        );

        console.log(
            "Unique records:",
            uniqueCompanies.length
        );

        console.log(
            "JSON:",
            OUTPUT_JSON
        );

        console.log(
            "CSV:",
            OUTPUT_CSV
        );

        console.log(
            "========================================"
        );


    } catch (error) {

        console.log(
            "\nSCRAPER ERROR:"
        );

        console.log(
            error.message
        );


    } finally {

        // Always close browser
        await driver.quit();

    }
}



// ==================================================
// START
// ==================================================

scrapeCompanies();