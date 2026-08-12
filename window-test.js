const {
    Builder,
    By,
    until
} = require("selenium-webdriver");

async function windowTest() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "https://the-internet.herokuapp.com/windows"
        );

        // Store main window
        let mainWindow =
            await driver.getWindowHandle();

        console.log(
            "Main Window:",
            mainWindow
        );

        // Click link to open new window
        let link = await driver.findElement(
            By.linkText("Click Here")
        );

        await link.click();

        // Wait until new window appears
        await driver.wait(
            async () => {
                let handles =
                    await driver.getAllWindowHandles();

                return handles.length === 2;
            },
            10000
        );

        // Get all windows
        let windows =
            await driver.getAllWindowHandles();

        console.log(
            "Windows:",
            windows
        );

        // Switch to new window
        let newWindow = windows.find(
            handle => handle !== mainWindow
        );

        await driver.switchTo().window(
            newWindow
        );

        // Get heading
        let heading = await driver.wait(
            until.elementLocated(
                By.css("h3")
            ),
            10000
        );

        let text = await heading.getText();

        console.log(
            "New Window Heading:",
            text
        );

        // Switch back to main window
        await driver.switchTo().window(
            mainWindow
        );

        console.log(
            "Returned to main window"
        );

        await driver.sleep(2000);

    } finally {

        await driver.quit();

    }
}

windowTest();