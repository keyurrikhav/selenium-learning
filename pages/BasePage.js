const {until} = require('selenium-webdriver');

class basePage{
    constructor(driver){
        this.driver = driver;
    }
    async waitForElement(locator, timeout = 10000){

        return await this.driver.wait(
            until.elementLocated(locator),
            timeout
        );
    }
    async click(locator){
        let element = await this.waitForElement(locator);
        await element.click();
    }
    async type(locator , text){
        let element = await this.waitForElement(locator);
        await element.sendKeys(text);
    }
    async getText(locator){
        let element = await this.waitForElement(locator);
        return await element.getText();
    }
    async isDisplayed(locator){
        let element = await this.waitForElement(locator);
        return await element.isDisplayed();
    }

}

module.exports = basePage;