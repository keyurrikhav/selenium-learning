const { Builder, By } = require("selenium-webdriver");
const assert = require("assert");

async function loginTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // Open website
        await driver.get(
            "https://the-internet.herokuapp.com/login"
        );

        // Username
        let username = await driver.findElement(
            By.id("username")
        );

        await username.sendKeys("tomsmith");

        // Password
        let password = await driver.findElement(
            By.id("password")
        );

        await password.sendKeys("SuperSecretPassword!");

        // Login button
        let loginButton = await driver.findElement(
            By.css("button[type='submit']")
        );

        await loginButton.click();




        // Get heading
        let heading = await driver.findElement(
            By.css("h2")
        );

        let actualText = await heading.getText();

        console.log("Actual:", actualText);

        // Assertion
        assert.strictEqual(
            actualText,
            "Secure Area"
        );

        console.log("TEST PASSED");


        let currentUrl = await driver.getCurrentUrl();
        assert.strictEqual(
            currentUrl,
            "https://the-internet.herokuapp.com/secure"
        );

        let logoutButton = await driver.findElement(
            By.css("a.button")
        );

        assert.ok(
            await logoutButton.isDisplayed()
        );

    } finally {

        await driver.quit();

    }
}

loginTest();