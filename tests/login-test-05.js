const { Builder  } = require('selenium-webdriver');

const assert = require('assert');

const LoginPage = require('../pages/login-page-01');

async function loginTest() {
    let driver = await new Builder()
    .forBrowser('chrome')
    .build();

    try{
        let loginPage = new LoginPage(driver);

        await loginPage.open();

        await loginPage.enterUsername('tomsmith');

        await loginPage.enterPassword('SuperSecretPassword!');

        await loginPage.clickLogin();

        let heading = 
        await loginPage.getHeading();
          assert.strictEqual(
            heading,
            "Secure Area"
        );
        console.log(
            "Login test passed"
        );

        await loginPage.logout();
         console.log(
            "Logout completed"
        );
    }finally{
        await driver.quit();
    }
}
loginTest();
