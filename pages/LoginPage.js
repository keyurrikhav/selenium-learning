const { By, until } = require("selenium-webdriver");

class LoginPage {

    constructor(driver) {
        this.driver = driver;

        this.username = By.id("username");
        this.password = By.id("password");
        this.loginButton = By.css(
            "button[type='submit']"
        );
        this.heading = By.css("h2");
    }

    async open() {

        await this.driver.get(
            "https://the-internet.herokuapp.com/login"
        );
    }

    async enterUsername(username) {

        let element = await this.driver.wait(
            until.elementLocated(
                this.username
            ),
            10000
        );

        await element.sendKeys(username);
    }

    async enterPassword(password) {

        let element = await this.driver.wait(
            until.elementLocated(
                this.password
            ),
            10000
        );

        await element.sendKeys(password);
    }

    async clickLogin() {

        let button = await this.driver.wait(
            until.elementLocated(
                this.loginButton
            ),
            10000
        );

        await button.click();
    }

    async getHeading() {

        let heading = await this.driver.wait(
            until.elementLocated(
                this.heading
            ),
            10000
        );

        return await heading.getText();
    }
}

module.exports = LoginPage;