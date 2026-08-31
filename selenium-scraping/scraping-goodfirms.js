const { Builder, By, until } =
    require("selenium-webdriver");

const fs = require("fs");


// ==================================================
// CONFIGURATION
// ==================================================

// Use a website/environment where automated scraping
// is permitted.
const START_URL =
    "https://example.com/page1";

const OUTPUT_JSON =
    "companies.json";

const OUTPUT_CSV =
    "companies.csv";


// ==================================================
// SCRAPE CURRENT PAGE
// ==================================================

async function scrapeCurrentPage(driver) {

    const companies =
        await driver.findElements(
            By.css("li.firm-wrapper")
        );

    const pageData = [];


    for (const company of companies) {

        try {

            const companyName =
                await getTextSafe(
                    company,
                    "h3.firm-name a"
                );


            const size =
                await getTextSafe(
                    company,
                    ".firm-employees span"
                );


            const location =
                await getTextSafe(
                    company,
                    ".firm-location span"
                );


            const url =
                await getAttributeSafe(
                    company,
                    ".firm-urls a",
                    "href"
                );


            pageData.push({

                companyName,
                size,
                location,
                url

            });


        } catch (error) {

            console.log(
                "Company extraction error:",
                error.message
            );

        }

    }


    return pageData;
}



// ==================================================
// SAFE GET TEXT
// ==================================================

async function getTextSafe(
    element,
    selector
) {

    try {

        const child =
            await element.findElement(
                By.css(selector)
            );

        return (
            await child.getText()
        ).trim();

    } catch {

        return "";

    }

}



// ==================================================
// SAFE GET ATTRIBUTE
// ==================================================

async function getAttributeSafe(
    element,
    selector,
    attribute
) {

    try {

        const child =
            await element.findElement(
                By.css(selector)
            );

        const value =
            await child.getAttribute(
                attribute
            );

        return value
            ? value.trim()
            : "";

    } catch {

        return "";

    }

}



// ==================================================
// GET NEXT PAGE URL
// ==================================================

async function getNextPageUrl(driver) {

    const nextButtons =
        await driver.findElements(
            By.css("li.next-page a")
        );


    if (nextButtons.length === 0) {

        return null;

    }


    const href =
        await nextButtons[0]
            .getAttribute("href");


    if (!href) {

        return null;

    }


    const currentUrl =
        await driver.getCurrentUrl();


    return new URL(
        href,
        currentUrl
    ).href;

}



// ==================================================
// CLEAN DATA
// ==================================================

function cleanCompany(company) {

    return {

        companyName:
            String(
                company.companyName || ""
            )
            .replace(/\s+/g, " ")
            .trim(),

        size:
            String(
                company.size || ""
            )
            .replace(/\s+/g, " ")
            .trim(),

        location:
            String(
                company.location || ""
            )
            .replace(/\s+/g, " ")
            .trim(),

        url:
            String(
                company.url || ""
            )
            .trim()

    };

}



// ==================================================
// VALIDATE DATA
// ==================================================

function isValidCompany(company) {

    return (
        company.companyName &&
        company.size &&
        company.location &&
        company.url
    );

}



// ==================================================
// REMOVE DUPLICATES
// ==================================================

function removeDuplicates(companies) {

    const unique =
        new Map();


    for (const company of companies) {

        unique.set(
            company.url.toLowerCase(),
            company
        );

    }


    return Array.from(
        unique.values()
    );

}



// ==================================================
// SAVE JSON
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
// CSV ESCAPE
// ==================================================

function escapeCSV(value) {

    const text =
        String(value ?? "");


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
// SAVE CSV
// ==================================================

function saveCSV(companies) {

    const headers = [
        "companyName",
        "size",
        "location",
        "url"
    ];


    const rows = [
        headers.join(",")
    ];


    for (const company of companies) {

        rows.push(

            [
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

            ].join(",")

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
// MAIN
// ==================================================

async function scrapeCompanies() {

    const driver =
        await new Builder()
            .forBrowser("chrome")
            .build();


    try {

        const allCompanies = [];

        let currentUrl =
            START_URL;

        let pageNumber = 1;


        // ==================================================
        // MAIN TAB
        // ==================================================

        console.log(
            "Opening first page..."
        );


        await driver.get(
            currentUrl
        );


        // Remember the first tab
        const mainWindow =
            await driver.getWindowHandle();


        while (currentUrl) {

            console.log(
                "\n================================"
            );

            console.log(
                `PAGE ${pageNumber}`
            );

            console.log(
                "URL:",
                currentUrl
            );

            console.log(
                "================================"
            );


            // ==================================================
            // PAGE 1
            // ==================================================

            if (pageNumber === 1) {

                // We are already in main tab.

                await driver.wait(

                    until.elementLocated(

                        By.css(
                            "li.firm-wrapper"
                        )

                    ),

                    10000

                );

            }


            // ==================================================
            // PAGE 2+
            // ==================================================

            else {

                console.log(
                    "Opening NEW TAB..."
                );


                // Open new browser tab
                await driver.switchTo()
                    .newWindow("tab");


                console.log(
                    "New tab opened."
                );


                // Navigate new tab
                await driver.get(
                    currentUrl
                );


                console.log(
                    "New tab URL:",
                    await driver.getCurrentUrl()
                );


                // Wait for page data
                await driver.wait(

                    until.elementLocated(

                        By.css(
                            "li.firm-wrapper"
                        )

                    ),

                    10000

                );

            }


            // ==================================================
            // SCRAPE PAGE
            // ==================================================

            const pageData =
                await scrapeCurrentPage(
                    driver
                );


            console.log(
                "Companies found:",
                pageData.length
            );


            allCompanies.push(
                ...pageData
            );


            console.log(
                "Total raw records:",
                allCompanies.length
            );


            // ==================================================
            // GET NEXT URL
            // ==================================================

            const nextUrl =
                await getNextPageUrl(
                    driver
                );


            // ==================================================
            // CLOSE CURRENT TAB
            // ==================================================

            if (pageNumber > 1) {

                console.log(
                    "Closing current tab..."
                );


                await driver.close();


                // Go back to main tab
                await driver.switchTo()
                    .window(mainWindow);


                console.log(
                    "Returned to main tab."
                );

            }


            // ==================================================
            // MOVE TO NEXT PAGE
            // ==================================================

            currentUrl =
                nextUrl;


            if (currentUrl) {

                pageNumber++;

            }

        }


        // ==================================================
        // CLEAN DATA
        // ==================================================

        console.log(
            "\n================================"
        );

        console.log(
            "DATA CLEANING"
        );

        console.log(
            "================================"
        );


        const cleaned =
            allCompanies.map(
                cleanCompany
            );


        console.log(
            "After cleaning:",
            cleaned.length
        );


        // ==================================================
        // VALIDATION
        // ==================================================

        const valid =
            cleaned.filter(
                isValidCompany
            );


        console.log(
            "Valid records:",
            valid.length
        );


        // ==================================================
        // DUPLICATES
        // ==================================================

        const unique =
            removeDuplicates(
                valid
            );


        console.log(
            "Unique records:",
            unique.length
        );


        // ==================================================
        // SAVE
        // ==================================================

        saveJSON(unique);

        saveCSV(unique);


        // ==================================================
        // FINAL REPORT
        // ==================================================

        console.log(
            "\n================================"
        );

        console.log(
            "SCRAPING COMPLETE"
        );

        console.log(
            "================================"
        );

        console.log(
            "Pages processed:",
            pageNumber
        );

        console.log(
            "Raw records:",
            allCompanies.length
        );

        console.log(
            "Valid records:",
            valid.length
        );

        console.log(
            "Unique records:",
            unique.length
        );

        console.log(
            "================================"
        );


    } catch (error) {

        console.log(
            "\nSCRAPER ERROR:"
        );

        console.log(
            error.message
        );

    } finally {

        await driver.quit();

    }

}


// ==================================================
// START
// ==================================================

scrapeCompanies();