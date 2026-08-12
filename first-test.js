const { Builder } = require("selenium-webdriver");

async function firstTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    await driver.get("https://www.google.com");

    await driver.sleep(3000);

    await driver.quit();
}

firstTest();