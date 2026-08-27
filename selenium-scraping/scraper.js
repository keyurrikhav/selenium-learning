const { Builder, By, until } = require("selenium-webdriver");

async function scrapeProducts() {

    const driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get("https://books.toscrape.com/");

        console.log("Website opened");

    } finally {

        await driver.quit();
    }
}

scrapeProducts();