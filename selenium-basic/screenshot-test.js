const {
    Builder
} = require("selenium-webdriver");

const fs = require("fs");

async function screenshotTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/"
        );

        let screenshot =
            await driver.takeScreenshot();

        fs.writeFileSync(
            "homepage.png",
            screenshot,
            "base64"
        );

        console.log(
            "Screenshot saved successfully"
        );

    } finally {

        await driver.quit();

    }
}

screenshotTest();