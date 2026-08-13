const {
    Builder
} = require("selenium-webdriver");

const assert = require("assert");

const LoginPage = require(
    "../pages/LoginPage"
);

async function loginTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        let loginPage =
            new LoginPage(driver);

        await loginPage.open();

        await loginPage.enterUsername(
            "tomsmith"
        );

        await loginPage.enterPassword(
            "SuperSecretPassword!"
        );

        await loginPage.clickLogin();

        let heading =
            await loginPage.getHeading();

        console.log(
            "Heading:",
            heading
        );

        assert.strictEqual(
            heading,
            "Secure Area"
        );

        console.log(
            "TEST PASSED"
        );

    } finally {

        await driver.quit();

    }
}

loginTest();