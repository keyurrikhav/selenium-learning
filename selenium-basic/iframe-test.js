const {Builder, By, Until, until} = require("selenium-webdriver");

async function iframeTest(){
    let driver = await new Builder().forBrowser("chrome").build();

    try{
        await driver.get("https://the-internet.herokuapp.com/iframe");

        // find to iframe
        let iframe = await driver.wait(
            until.elementLocated(By.id("mce_0_ifr")),
            10000
        );

        await driver.switchTo().frame(iframe);

        let body = await driver.findElement(By.css("body"));

        let text = await body.getText();

        console.log("Text:",text);

    } finally{
        await driver.quit();
    }
}
iframeTest();