const {
    Builder,
    By
} = require("selenium-webdriver");

const fs = require("fs");

async function loginTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/login"
        );

        let username = await driver.findElement(
            By.id("username")
        );

        await username.sendKeys("tomsmith");

        let password = await driver.findElement(
            By.id("password")
        );

        await password.sendKeys(
            "SuperSecretPassword!"
        );

        let loginButton = await driver.findElement(
            By.css("button[type='submit']")
        );

        await loginButton.click();

        console.log("Login completed");

    } catch (error) {

        console.log(
            "TEST FAILED"
        );

        let screenshot =
            await driver.takeScreenshot();

        fs.writeFileSync(
            "failure.png",
            screenshot,
            "base64"
        );

        console.log(
            "Failure screenshot saved"
        );

        throw error;

    } finally {

        await driver.quit();

    }
}

loginTest();