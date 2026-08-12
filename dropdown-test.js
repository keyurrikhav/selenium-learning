const {
    Builder,
    By
} = require("selenium-webdriver");

const { Select } = require("selenium-webdriver");

async function dropdownTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/dropdown"
        );

        let dropdown = await driver.findElement(
            By.id("dropdown")
        );

        let select = new Select(dropdown);

        // Select by visible text
        await select.selectByVisibleText("Option 2");

        console.log("Option 2 selected");

        await driver.sleep(2000);

    } finally {

        await driver.quit();

    }
}

dropdownTest();