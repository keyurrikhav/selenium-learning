const { Builder, By, until } =
    require("selenium-webdriver");

const fs = require("fs");
const path = require("path");


// ==================================================
// CONFIG — this is the ONLY part you change per page
// ==================================================

const URL = "https://www.goodfirms.co/directory/languages/top-software-development-companies?page=11";
const OUTPUT = "data/page-11.json";


// ==================================================
// Scrape all company cards on the current page
// ==================================================

async function scrapeCurrentPage(driver) {

    const companies = await driver.findElements(
        By.css("li.firm-wrapper")
    );

    const pageData = [];


    for (const company of companies) {

        try {

            const companyName =
                await company
                    .findElement(By.css("h3.firm-name a"))
                    .getText();

            const size =
                await company
                    .findElement(By.css(".firm-employees span"))
                    .getText();

            const location =
                await company
                    .findElement(By.css(".firm-location span"))
                    .getText();

            const url =
                await company
                    .findElement(By.css(".firm-urls a"))
                    .getAttribute("href");

            pageData.push({
                companyName: companyName.trim(),
                size: size.trim(),
                location: location.trim(),
                url: url ? url.trim() : ""
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
// Main — open the page, scrape it, save the file
// ==================================================

async function run() {

    const driver =
        await new Builder()
            .forBrowser("chrome")
            .build();

    try {

        console.log("Opening:", URL);

        await driver.get(URL);

        console.log("Current URL:", await driver.getCurrentUrl());
        console.log("Page title:", await driver.getTitle());


        // --------------------------------------------------
        // Give YOU time to solve any captcha/verification
        // manually in the opened browser window before the
        // scraper starts looking for company cards.
        // --------------------------------------------------
        console.log(
            "\nIf a security check appears in the browser window, " +
            "solve it manually now. Waiting 15 seconds..."
        );

        await driver.sleep(15000);


        // Wait for company cards to be present
        await driver.wait(
            until.elementLocated(By.css("li.firm-wrapper")),
            15000
        );


        const pageData = await scrapeCurrentPage(driver);

        console.log("\nCompanies found:", pageData.length);
        console.log(pageData);


        // --------------------------------------------------
        // Make sure the output folder exists, then save
        // --------------------------------------------------
        const outputDir = path.dirname(OUTPUT);

        if (outputDir && !fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            OUTPUT,
            JSON.stringify(pageData, null, 2),
            "utf8"
        );

        console.log("\nSaved to:", OUTPUT);


    } finally {

        await driver.quit();
    }
}


run();