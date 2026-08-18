const {
    Builder,
    By,
    until,
    Key
} = require("selenium-webdriver");

const assert = require("assert");


describe("iFrame Test Suite", function () {

    this.timeout(30000);

    let driver;


    // Start browser before test
    beforeEach(async function () {

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

    });


    // Close browser after test
    afterEach(async function () {

        await driver.quit();

    });


    it("should enter and verify text inside iframe", async function () {

        // 1. Open the page
        await driver.get(
            "https://the-internet.herokuapp.com/iframe"
        );


        // 2. Find the iframe
        let iframe =
            await driver.wait(
                until.elementLocated(
                    By.id("mce_0_ifr")
                ),
                10000
            );


        // 3. Switch into iframe
        await driver.switchTo().frame(
            iframe
        );


        // 4. Find the editor
        let editor =
            await driver.wait(
                until.elementLocated(
                    By.id("tinymce")
                ),
                10000
            );


        let expectedText =
            "Selenium is awesome";

            await editor.click();
            
        await editor.sendKeys(
            Key.CONTROL,
            "a"
        );
        await editor.sendKeys(
            expectedText
        );


        // 7. Read the text
        let actualText =
            await editor.getText();


        // 8. Print results
        console.log(
            "Expected:",
            expectedText
        );

        console.log(
            "Actual:",
            actualText
        );


        // 9. Verify
        assert.strictEqual(
            actualText,
            expectedText
        );


        // 10. Return to main page
        await driver.switchTo()
            .defaultContent();


        console.log(
            "iFrame test passed"
        );

    });

});