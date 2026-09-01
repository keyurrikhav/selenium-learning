const puppeteer = require("puppeteer");
const fs = require("fs");


// ==================================================
// CONFIGURATION
// ==================================================

const START_URL =
    "https://www.goodfirms.co/directory/languages/top-software-development-companies";

const OUTPUT_JSON = "companies-puppeteer.json";
const OUTPUT_CSV = "companies-puppeteer.csv";


// ==================================================
// 1. SCRAPE CURRENT PAGE
// ==================================================
// In Selenium you loop over WebElements and call
// findElement() on each one. In Puppeteer, the easiest
// and fastest way is to do the whole extraction inside
// page.evaluate(), which runs directly in the browser
// and returns plain JS data.

async function scrapeCurrentPage(page) {

    const pageData = await page.evaluate(() => {

        const cards =
            document.querySelectorAll("li.firm-wrapper");

        const results = [];


        cards.forEach((card) => {

            try {

                // ------------------------------------------
                // Company Name
                // ------------------------------------------

                const nameEl =
                    card.querySelector("h3.firm-name a");

                const companyName =
                    nameEl ? nameEl.textContent : "";


                // ------------------------------------------
                // Company Size
                // ------------------------------------------

                const sizeEl =
                    card.querySelector(".firm-employees span");

                const size =
                    sizeEl ? sizeEl.textContent : "";


                // ------------------------------------------
                // Location
                // ------------------------------------------

                const locationEl =
                    card.querySelector(".firm-location span");

                const location =
                    locationEl ? locationEl.textContent : "";


                // ------------------------------------------
                // Company Website
                // ------------------------------------------

                const urlEl =
                    card.querySelector(".firm-urls a");

                const url =
                    urlEl ? urlEl.getAttribute("href") : "";


                // ------------------------------------------
                // Add record
                // ------------------------------------------

                results.push({
                    companyName: companyName ? companyName.trim() : "",
                    size: size ? size.trim() : "",
                    location: location ? location.trim() : "",
                    url: url ? url.trim() : ""
                });

            } catch (error) {

                // Skip this card if something inside it
                // is missing/broken
            }
        });


        return results;
    });


    return pageData;
}



// ==================================================
// 2. GET NEXT PAGE URL
// ==================================================

async function getNextPageUrl(page) {

    const nextUrl = await page.evaluate(() => {

        const nextLink =
            document.querySelector("li.next-page a");

        if (!nextLink) {
            return null;
        }

        // .href on an anchor element already resolves
        // to an absolute URL, same as what we did
        // manually with `new URL()` in the Selenium version
        return nextLink.href || null;
    });

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

    if (!company.companyName) {
        return false;
    }

    if (!company.size) {
        return false;
    }

    if (!company.location) {
        return false;
    }

    if (!company.url) {
        return false;
    }

    return true;
}



// ==================================================
// 5. REMOVE DUPLICATES
// ==================================================

function removeDuplicates(companies) {

    const uniqueCompanies = new Map();

    for (const company of companies) {

        const key = company.url.toLowerCase();

        uniqueCompanies.set(key, company);
    }

    return Array.from(uniqueCompanies.values());
}



// ==================================================
// 6. SAVE JSON
// ==================================================

function saveJSON(companies) {

    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(companies, null, 2),
        "utf8"
    );

    console.log(`JSON saved: ${OUTPUT_JSON}`);
}



// ==================================================
// 7. CSV ESCAPE FUNCTION
// ==================================================

function escapeCSV(value) {

    const text = String(value ?? "");

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}



// ==================================================
// 8. SAVE CSV
// ==================================================

function saveCSV(companies) {

    const headers = ["companyName", "size", "location", "url"];

    const rows = [headers.join(",")];

    for (const company of companies) {

        const row = [
            escapeCSV(company.companyName),
            escapeCSV(company.size),
            escapeCSV(company.location),
            escapeCSV(company.url)
        ];

        rows.push(row.join(","));
    }

    fs.writeFileSync(
        OUTPUT_CSV,
        rows.join("\n"),
        "utf8"
    );

    console.log(`CSV saved: ${OUTPUT_CSV}`);
}



// ==================================================
// 9. MAIN SCRAPER
// ==================================================

async function scrapeCompanies() {

    // headless: false so you can see the browser and
    // solve any security check manually, same as the
    // Selenium version
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-blink-features=AutomationControlled"]
    });

    const page = await browser.newPage();

    // Look like a normal desktop browser
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 850 });


    try {

        let currentUrl = START_URL;

        const allCompanies = [];

        let pageNumber = 1;


        // ------------------------------------------
        // Pagination loop
        // ------------------------------------------

        while (currentUrl) {

            console.log("\n========================================");
            console.log(`PAGE ${pageNumber}`);
            console.log("========================================");
            console.log("Scraping:", currentUrl);


            // In Puppeteer, page.goto() is the equivalent
            // of driver.get() in Selenium
            await page.goto(currentUrl, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });


            const actualUrl = page.url();
            console.log("Current URL:", actualUrl);

            const title = await page.title();
            console.log("Page title:", title);


            // --------------------------------------
            // Get body text (for verification check)
            // --------------------------------------

            const bodyText = await page.evaluate(
                () => document.body.innerText
            );


            // --------------------------------------
            // Detect verification page
            // --------------------------------------

            if (
                bodyText.includes("Performing security verification") ||
                title.includes("Just a moment")
            ) {

                console.log("\nSecurity verification detected.");
                console.log(
                    "Waiting 20 seconds so you can solve it manually in the browser window..."
                );

                // Give you time to solve it by hand,
                // same idea as the manual scraper.js
                await new Promise(resolve => setTimeout(resolve, 20000));

                // Re-check after waiting
                const bodyTextAfter = await page.evaluate(
                    () => document.body.innerText
                );

                if (
                    bodyTextAfter.includes("Performing security verification")
                ) {

                    console.log(
                        "Still blocked. Stopping scraper."
                    );

                    break;
                }
            }


            // --------------------------------------
            // Wait for company cards
            // --------------------------------------

            try {

                await page.waitForSelector(
                    "li.firm-wrapper",
                    { timeout: 10000 }
                );

            } catch (error) {

                console.log("\nCompany cards were not found.");
                console.log("Stopping scraper.");

                break;
            }


            // --------------------------------------
            // Scrape current page
            // --------------------------------------

            const pageData = await scrapeCurrentPage(page);

            console.log("Companies on this page:", pageData.length);


            allCompanies.push(...pageData);

            console.log("Raw total:", allCompanies.length);


            // --------------------------------------
            // Get next page
            // --------------------------------------

            currentUrl = await getNextPageUrl(page);

            if (currentUrl) {
                pageNumber++;
            }


            // Small polite delay before the next page
            await new Promise(resolve => setTimeout(resolve, 2000));
        }


        // ==================================================
        // DATA PROCESSING
        // ==================================================

        console.log("\n\n========================================");
        console.log("DATA PROCESSING");
        console.log("========================================");


        const cleanedCompanies = allCompanies.map(cleanCompany);
        console.log("After cleaning:", cleanedCompanies.length);


        const validCompanies = cleanedCompanies.filter(isValidCompany);
        console.log("Valid companies:", validCompanies.length);


        const uniqueCompanies = removeDuplicates(validCompanies);
        console.log("Unique companies:", uniqueCompanies.length);


        // ==================================================
        // SAVE DATA
        // ==================================================

        console.log("\n\n========================================");
        console.log("SAVING DATA");
        console.log("========================================");

        saveJSON(uniqueCompanies);
        saveCSV(uniqueCompanies);


        // ==================================================
        // FINAL SUMMARY
        // ==================================================

        console.log("\n\n========================================");
        console.log("SCRAPING COMPLETE");
        console.log("========================================");
        console.log("Raw records:", allCompanies.length);
        console.log("Valid records:", validCompanies.length);
        console.log("Unique records:", uniqueCompanies.length);
        console.log("JSON:", OUTPUT_JSON);
        console.log("CSV:", OUTPUT_CSV);
        console.log("========================================");


    } catch (error) {

        console.log("\nSCRAPER ERROR:");
        console.log(error.message);

    } finally {

        await browser.close();
    }
}



// ==================================================
// START
// ==================================================

scrapeCompanies();