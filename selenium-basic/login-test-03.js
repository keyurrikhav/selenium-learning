const {
    Builder,
    By,
    until
} = require("selenium-webdriver");

const assert = require("assert");

async function loginTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/login"
        );

        // Wait for username field
        let username = await driver.wait(
            until.elementLocated(
                By.id("username")
            ),
            10000
        );

        await username.sendKeys("tomsmith");

        // Password
        let password = await driver.wait(
            until.elementLocated(
                By.id("password")
            ),
            10000
        );

        await password.sendKeys(
            "SuperSecretPassword!"
        );

        // Login button
        let loginButton = await driver.wait(
            until.elementLocated(
                By.css("button[type='submit']")
            ),
            10000
        );

        await loginButton.click();

        // Wait for heading
        let heading = await driver.wait(
            until.elementLocated(
                By.css("h2")
            ),
            10000
        );

        let actualText = await heading.getText();

        console.log("Actual:", actualText);

        assert.strictEqual(
            actualText,
            "Secure Area"
        );

        console.log("TEST PASSED");

    } finally {

        await driver.quit();

    }
}

loginTest();