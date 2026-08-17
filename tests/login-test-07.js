const { Builder } =
    require("selenium-webdriver");

const assert =
    require("assert");

const LoginPage =
    require("../pages/login-page-01");

const loginData =
    require("../test-data/loginData-01");


describe("Data Driven Login Test", function () {

    this.timeout(30000);

    let driver;
    let loginPage;


    beforeEach(async function () {

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        loginPage =
            new LoginPage(driver);

    });


    afterEach(async function () {

        await driver.quit();

    });


    loginData.forEach(function (data) {

        it(data.testName, async function () {

            await loginPage.open();

            await loginPage.enterUsername(
                data.username
            );

            await loginPage.enterPassword(
                data.password
            );

            await loginPage.clickLogin();

            let heading =
                await loginPage.getHeading();

            console.log(
                "Test:",
                data.testName
            );

            console.log(
                "Actual:",
                heading
            );

            console.log(
                "Expected:",
                data.expected
            );

            assert.strictEqual(
                heading,
                data.expected
            );

        });

    });

});