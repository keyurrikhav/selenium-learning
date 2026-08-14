const { By } = require('selenium-webdriver');

const BasePage = require('./BasePage');

class LoginPage extends BasePage {

    constructor(driver) {

        super(driver);

        // Username field
        this.username =
            By.id('username');

        // Password field
        this.password =
            By.id('password');

        // Login button
        this.loginButton =
            By.css("button[type='submit']");

        // Page heading
        this.heading =
            By.css('h2');

        // Logout button
        this.logoutButton =
            By.css('a.button');

        // Login success/error message
        this.flashMessage =
            By.id('flash');
    }

    // Open Login Page
    async open() {

        await this.driver.get(
            'https://the-internet.herokuapp.com/login'
        );
    }

    // Enter Username
    async enterUsername(username) {

        await this.type(
            this.username,
            username
        );
    }

    // Enter Password
    async enterPassword(password) {

        await this.type(
            this.password,
            password
        );
    }

    // Click Login
    async clickLogin() {

        await this.click(
            this.loginButton
        );
    }

    // Get Page Heading
    async getHeading() {

        return await this.getText(
            this.heading
        );
    }

    // Get Flash Message
    async getFlashMessage() {

        return await this.getText(
            this.flashMessage
        );
    }

    // Get entered Username
    async getUsernameValue() {

        return await this.getAttribute(
            this.username,
            'value'
        );
    }

    // Get entered Password
    async getPasswordValue() {

        return await this.getAttribute(
            this.password,
            'value'
        );
    }

    // Logout
    async logout() {

        await this.click(
            this.logoutButton
        );
    }
}

module.exports = LoginPage;