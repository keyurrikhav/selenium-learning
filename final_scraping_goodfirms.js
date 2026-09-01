const { Builder, By, until } =
    require("selenium-webdriver");

const fs = require("fs");


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
// 9. MAIN SCRAPER
// ==================================================

async function scrapeCompanies() {

    const driver =
        await new Builder()
            .forBrowser("chrome")
            .build();


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
                title.includes(
                    "Just a moment"
                )
            ) {

                console.log(
                    "\nSecurity verification detected."
                );

                console.log(
                    "Stopping scraper instead of bypassing the verification."
                );

                break;
            }


            // --------------------------------------
            // Wait for company cards
            // --------------------------------------

            try {

                await driver.wait(

                    until.elementLocated(

                        By.css(
                            "li.firm-wrapper"
                        )

                    ),

                    10000

                );

            } catch (error) {

                console.log(
                    "\nCompany cards were not found."
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