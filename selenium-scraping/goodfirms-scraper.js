const { Builder, By, until } =
    require("selenium-webdriver");

async function scrapeCompanies() {

    const driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://www.goodfirms.co/directory/languages/top-software-development-companies"
        );

        // Wait for company cards
        await driver.wait(
            until.elementLocated(
                By.css("li.firm-wrapper")
            ),
            10000
        );

        // Find all company cards
        const companies = await driver.findElements(
            By.css("li.firm-wrapper")
        );

        console.log(
            "Companies found:",
            companies.length
        );


        const data = [];


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


            // Location
            const location = await company
                .findElement(
                    By.css(".firm-location span")
                )
                .getText();


            // Company Website
            const url = await company
                .findElement(
                    By.css(".firm-urls a")
                )
                .getAttribute("href");


            data.push({
                companyName: companyName.trim(),
                size: size.trim(),
                location: location.trim(),
                url: url.trim()
            });
        }


        console.log(data);

    } finally {

        await driver.quit();
    }
}

scrapeCompanies();