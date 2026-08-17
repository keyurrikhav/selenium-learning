const { Builder } = require('selenium-webdriver');

const assert = require('assert');

const LoginPage =
    require('../pages/login-page-01');

const loginData =
    require('../test-data/loginData');


describe('Login Test Suite', function () {

    this.timeout(30000);

    let driver;
    let loginPage;


    beforeEach(async function () {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        loginPage =
            new LoginPage(driver);

    });


    afterEach(async function () {

        await driver.quit();

    });


    it('should login with valid credentials', async function () {

        await loginPage.open();

        await loginPage.enterUsername(
            loginData.validUser.username
        );

        await loginPage.enterPassword(
            loginData.validUser.password
        );

        await loginPage.clickLogin();

        let heading =
            await loginPage.getHeading();

        assert.strictEqual(
            heading,
            'Secure Area'
        );

    });


    it('should reject invalid password', async function () {

        await loginPage.open();

        await loginPage.enterUsername(
            loginData.invalidPassword.username
        );

        await loginPage.enterPassword(
            loginData.invalidPassword.password
        );

        await loginPage.clickLogin();

        let message =
            await loginPage.getFlashMessage();

        console.log(
            'Error message:',
            message
        );

    });

});