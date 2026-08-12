const {Builder, By, until} = require('selenium-webdriver');

async function tableTest(){
    let driver = await new Builder().forBrowser("chrome").build();

    try{
        await driver.get("https://the-internet.herokuapp.com/tables");
        

        let rows = await driver.findElements(
            By.css("#table1 tbody tr")
        );

        console.log(
            "Total Rows:",
            rows.length
        );

        for (let row of rows) {

            let cells = await row.findElements(
                By.css("td")
            );

            let rowData = [];

            for (let cell of cells) {

                rowData.push(
                    await cell.getText()
                );

            }

            console.log(rowData);
        }

    }finally{
        await driver.quit();
    }
}
tableTest();

// Find a Specific User

// let rows = await driver.findElements(
//     By.css("#table1 tbody tr")
// );

// for (let row of rows) {

//     let rowText = await row.getText();

//     if (rowText.includes("Jason")) {

//         console.log(
//             "Jason found!"
//         );

//         break;
//     }
// }