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

        const data = [];

        for (const book of books) {
            const title = await book
                .findElement(By.css("h3 a"))
                .getAttribute("title");

            const price = await book
                .findElement(By.css(".price_color"))
                .getText();

            const url = await book
                .findElement(By.css("h3 a"))
                .getAttribute("href");

               // Rating
            const ratingElement = await book
                .findElement(By.css(".star-rating"));

            const ratingClass = await ratingElement
                .getAttribute("class");

            const rating = ratingClass
                .split(" ")[1];    

                data.push({
                    title,price,url,rating
                });
            console.log(data);
        }
    } finally {

        await driver.quit();
    }
}

scrapeProducts();