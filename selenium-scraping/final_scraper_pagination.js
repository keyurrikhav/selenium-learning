const { Builder, By, until } =
    require("selenium-webdriver");


// --------------------------------------------------
// Scrape companies from the current page
// --------------------------------------------------
async function scrapeCurrentPage(driver) {

    const companies = await driver.findElements(
        By.css("li.firm-wrapper")
    );

    const pageData = [];


    for (const company of companies) {

        // Company Name
        const companyName = await company
            .findElement(
                By.css("h3.firm-name a")
            )
            .getText();


        // Company Size
        const size = await company
            .findElement(
                By.css(".firm-employees span")
            )
            .getText();


        // Company Location
        const location = await company
            .findElement(
                By.css(".firm-location span")
            )
            .getText();


        // Company Website URL
        const url = await company
            .findElement(
                By.css(".firm-urls a")
            )
            .getAttribute("href");


        // Store company data
        pageData.push({

            companyName:
                companyName.trim(),

            size:
                size.trim(),

            location:
                location.trim(),

            url:
                url.trim()

        });
    }


    return pageData;
}



// --------------------------------------------------
// Get the URL of the next page
// --------------------------------------------------
async function getNextPageUrl(driver) {

    const nextButtons =
        await driver.findElements(
            By.css("li.next-page a")
        );


    // No Next button = last page
    if (nextButtons.length === 0) {

        return null;

    }


    // Get relative URL
    const relativeUrl =
        await nextButtons[0]
            .getAttribute("href");


    // Get current page URL
    const currentUrl =
        await driver.getCurrentUrl();


    // Convert relative URL to full URL
    const nextUrl =
        new URL(
            relativeUrl,
            currentUrl
        ).href;


    return nextUrl;
}



// --------------------------------------------------
// Main scraper
// --------------------------------------------------
async function scrapeCompanies() {

    const driver =
        await new Builder()
            .forBrowser("chrome")
            .build();


    try {

        // Starting page
        let currentUrl =
            "https://www.goodfirms.co/directory/languages/top-software-development-companies";


        // Store ALL companies
        const allCompanies = [];


        // Keep running while a next page exists
        while (currentUrl) {

            console.log(
                "\n----------------------------------------"
            );

            console.log(
                "Scraping:",
                currentUrl
            );


            // IMPORTANT:
            // Open the current page
            await driver.get(currentUrl);


            // Check where Selenium actually went
            console.log(
                "Current URL:",
                await driver.getCurrentUrl()
            );


            console.log(
                "Page title:",
                await driver.getTitle()
            );


            // Get page text for debugging
            const pageText =
                await driver
                    .findElement(
                        By.tagName("body")
                    )
                    .getText();


            console.log(
                "Page preview:",
                pageText.substring(0, 500)
            );


            // Take screenshot for debugging
            await driver
                .takeScreenshot()
                .then(image => {

                    require("fs").writeFileSync(
                        "debug-page.png",
                        image,
                        "base64"
                    );

                });


            // Wait for company cards
            await driver.wait(
                until.elementLocated(
                    By.css("li.firm-wrapper")
                ),
                30000
            );


            // Scrape current page
            const pageData =
                await scrapeCurrentPage(
                    driver
                );


            // Add current page's companies
            // to the main array
            allCompanies.push(
                ...pageData
            );


            console.log(
                "Companies on this page:",
                pageData.length
            );


            console.log(
                "Total companies:",
                allCompanies.length
            );


            // Find next page
            currentUrl =
                await getNextPageUrl(
                    driver
                );

        }


        // --------------------------------------------------
        // Finished
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "Finished scraping!"
        );

        console.log(
            "Total companies:",
            allCompanies.length
        );

        console.log(
            "========================================"
        );


    }
    finally {

        // Always close Chrome
        await driver.quit();

    }
}



// --------------------------------------------------
// Start scraper
// --------------------------------------------------

scrapeCompanies();