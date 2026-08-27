const { Builder, By, until } = require("selenium-webdriver");

async function scrapeProducts() {

    const driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get("https://books.toscrape.com/");

        // console.log("Website opened");
        const books = await driver.findElements(
            By.css(".product_pod")
        );

         console.log("Total books:", books.length);

          for (const book of books)
       {
         const title = await book
            .findElement(By.css("h3 a"))
            .getText();

        const price = await book
            .findElement(By.css(".price_color"))
            .getText();

            console.log({
                title,price
            });
       }
    } finally {

        await driver.quit();
    }
}

scrapeProducts();