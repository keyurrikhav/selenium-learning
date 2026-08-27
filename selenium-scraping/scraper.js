const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

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

        const ratingMap = {
            One: 1,
            Two: 2,
            Three: 3,
            Four: 4,
            Five: 5
        };

        for (const book of books) {

            const title = (await book
                .findElement(By.css("h3 a"))
                .getAttribute("title")).trim();

            const priceText = await book
                .findElement(By.css(".price_color"))
                .getText();

            const price = parseFloat(
                priceText.replace("£", "").trim()
            );

            const rawUrl = await book
                .findElement(By.css("h3 a"))
                .getAttribute("href");

            const url = new URL(
                rawUrl,
                "https://books.toscrape.com/"
            ).href;

            // Rating
            const ratingElement = await book
                .findElement(By.css(".star-rating"));

            const ratingClass = await ratingElement
                .getAttribute("class");

            const ratingWord = ratingClass
                .split(" ")[1];

            const rating = ratingMap[ratingWord];

            data.push({
                title, price, url, rating
            });
            // console.log(data);
        }
        fs.writeFileSync(
            "books.json",
            JSON.stringify(data, null, 2)
        );

        console.log(`Scraped ${data.length} books`);
        console.log("Data saved to books.json");

    } finally {

        await driver.quit();
    }
}

scrapeProducts();