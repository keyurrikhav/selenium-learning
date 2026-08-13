const {By} = require('selenium-webdriver');

const BasePage = require("./BasePage");

class loginPage extends BasePage{
        constructor(driver){
            super(driver);

       this.username =
             By.id("username");

        this.password =
            By.id("password");

        this.loginButton =
            By.css("button[type='submit']");

        this.heading =
            By.css("h2");

        this.logoutButton =
            By.css("a.button");
        }
         async open() {

        await this.driver.get(
            "https://the-internet.herokuapp.com/login"
        );
    }
       async enterUsername(username) {
    await this.type(this.username, username);
}

async enterPassword(password) {
    await this.type(this.password, password);
}

async clickLogin() {
    await this.click(this.loginButton);
}

async getHeading() {
    return await this.getText(this.heading);
}

async logout() {
    await this.click(this.logoutButton);
}
} 
module.exports = loginPage;