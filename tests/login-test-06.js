const { Builder } = require('selenium-webdriver');

const assert = require('assert');

const LoginPage =
    require('../pages/login-page-01');


describe('Login Test Suite', function () {

    // Mocha timeout
    this.timeout(30000);


    it('should login with valid credentials', async function () {

        // Create browser
        let driver = await new Builder()
            .forBrowser('chrome')
            .build();


        try {

            // Create Login Page object
            let loginPage =
                new LoginPage(driver);


            // Open Login Page
            await loginPage.open();


            // Enter Username
            await loginPage.enterUsername(
                'tomsmith'
            );


            // Enter Password
            await loginPage.enterPassword(
                'SuperSecretPassword!'
            );


            // Verify username was entered
            console.log(
                'Username:',
                await loginPage.getUsernameValue()
            );


            // Verify password was entered
            console.log(
                'Password:',
                await loginPage.getPasswordValue()
            );


            // Click Login
            await loginPage.clickLogin();


            // Print URL after login
            console.log(
                'URL after login:',
                await driver.getCurrentUrl()
            );


            // Get flash message
            console.log(
                'Flash message:',
                await loginPage.getFlashMessage()
            );


            // Get heading
            let heading =
                await loginPage.getHeading();


            console.log(
                'Heading:',
                heading
            );


            // Verify successful login
            assert.strictEqual(
                heading,
                'Secure Area'
            );


            console.log(
                'LOGIN TEST PASSED'
            );


        } finally {

            // Close browser
            await driver.quit();

        }

    });

});