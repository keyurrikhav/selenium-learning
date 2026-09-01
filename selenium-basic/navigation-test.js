const { Builder } = require("selenium-webdriver");

async function navigationTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // Open Google
        await driver.get("https://www.google.com");

        console.log(
            "URL:",
            await driver.getCurrentUrl()
        );

        console.log(
            "Title:",
            await driver.getTitle()
        );

        // Open another page
        await driver.get(
            "https://the-internet.herokuapp.com/"
        );

        console.log(
            "Second URL:",
            await driver.getCurrentUrl()
        );

        // Go back
        await driver.navigate().back();

        // Go forward
        await driver.navigate().forward();

        // Refresh
        await driver.navigate().refresh();

        await driver.sleep(2000);

    } finally {

        await driver.quit();

    }
}

navigationTest();