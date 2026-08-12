const {
    Builder,
    By
} = require("selenium-webdriver");

async function hoverTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/hovers"
        );

        let users = await driver.findElements(
            By.css(".figure")
        );

        console.log(
            "Total users:",
            users.length
        );

        // Hover over first user
        await driver.actions()
            .move({ origin: users[0] })
            .perform();

        await driver.sleep(2000);

    } finally {

        await driver.quit();

    }
}

hoverTest();


// Hover
// await driver.actions()
//     .move({ origin: element })
//     .perform();

// Double click
// await driver.actions()
//     .doubleClick(element)
//     .perform();

// Right click
// await driver.actions()
//     .contextClick(element)
//     .perform();

// Drag and drop
// await driver.actions()
//     .dragAndDrop(source, target)
//     .perform();

// Keyboard
// await driver.actions()
//     .sendKeys(Key.ESCAPE)
//     .perform();

// Enter
// await element.sendKeys(Key.ENTER);

// Ctrl + A
// await element.sendKeys(Key.CONTROL, "a");