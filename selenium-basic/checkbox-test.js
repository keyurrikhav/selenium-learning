const {Builder, By} = require("selenium-webdriver");

async function checkboxTest(){
    let driver = await new Builder()
    .forBrowser("chrome")
    .build();
    
    try{

        await driver.get("https://the-internet.herokuapp.com/checkboxes");

        let checkboxes = await driver.findElements(By.css("input[type='checkbox']"));

        console.log("number of checkboxes:", checkboxes.length);

        for(let checkbox of checkboxes){
            if(!(await checkbox.isSelected())){
                await checkbox.click(); 
            }
        }
        console.log("all checkboxes are selected");
        await driver.sleep(3000);
    } finally {
        await driver.quit();
    }
}
checkboxTest();