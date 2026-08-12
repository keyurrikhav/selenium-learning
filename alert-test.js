const {
    Builder,
    By,
    until
} = require("selenium-webdriver");

async function alertTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/javascript_alerts"
        );

        // Click JS Alert button
        let alertButton = await driver.findElement(
            By.xpath("//button[text()='Click for JS Alert']")
        );

        await alertButton.click();

        // Switch to alert
        let alert = await driver.switchTo().alert();

        // Get alert text
        let alertText = await alert.getText();

        console.log("Alert:", alertText);

        // Accept alert
        await alert.accept();

        console.log("Alert accepted");

        await driver.sleep(2000);

    } finally {

        await driver.quit();

    }
}

alertTest();