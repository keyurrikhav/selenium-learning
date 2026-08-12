const {Builder , By } = require("selenium-webdriver");

async function loginTest(){
    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {
        await driver.get("https://the-internet.herokuapp.com/login");
       
        let username = await driver.findElement(By.id("username"));
        
        await username.sendKeys("tomsmith");

        let password = await driver.findElement(By.id("password"));
        await password.sendKeys("SuperSecretPassword!");

        let loginbutton = await driver.findElement(By.css("button[type='submit']"));
        await loginbutton.click();

        await driver.sleep(3000);
    } finally{
        await driver.quit();
    }

}
loginTest();