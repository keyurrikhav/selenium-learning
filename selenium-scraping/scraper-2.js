const { Builder, By, until } =
    require("selenium-webdriver");

const fs = require("fs");

const URL =
    "https://www.goodfirms.co/directory/languages/top-software-development-companies?page=2";

async function scrapePage() {

    const driver =
        await new Builder()
            .forBrowser("chrome")
            .build();

    try {

        console.log("Opening page...");

        await driver.get(URL);


        // Wait for company cards
        await driver.wait(
            until.elementLocated(
                By.css("li.firm-wrapper")
            ),
            10000
        );


        // Find all company cards
        const companies =
            await driver.findElements(
                By.css("li.firm-wrapper")
            );


        console.log(
            "Companies found:",
            companies.length
        );


        const data = [];


        for (const company of companies) {

            try {

                const companyName =
                    await company
                        .findElement(
                            By.css("h3.firm-name a")
                        )
                        .getText();


                const size =
                    await company
                        .findElement(
                            By.css(".firm-employees span")
                        )
                        .getText();


                const location =
                    await company
                        .findElement(
                            By.css(".firm-location span")
                        )
                        .getText();


                const url =
                    await company
                        .findElement(
                            By.css(".firm-urls a")
                        )
                        .getAttribute("href");


                data.push({

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
                    "Could not scrape one company:",
                    error.message
                );

            }
        }


        // Save this page's data
        fs.writeFileSync(
            "data/page-2.json",
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

        console.log(
            "Saved:",
            data.length,
            "companies"
        );

        console.log(
            "File: data/page-1.json"
        );


    } finally {

        await driver.quit();

    }
}


scrapePage();