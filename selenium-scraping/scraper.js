const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function scrapeCurrentPage(driver) {

    // const driver = await new Builder()
    //     .forBrowser("chrome")
    //     .build();

    // try {

    //     await driver.get("https://books.toscrape.com/");

        // console.log("Website opened");
        const books = await driver.findElements(
            By.css(".product_pod")
        );

        console.log("Total books:", books.length);

        const pageData = [];

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

            pageData.push({
                title, price, url, rating
            });
            // console.log(data);
        }
            return pageData;
    //     fs.writeFileSync(
    //         "books.json",
    //         JSON.stringify(data, null, 2)
    //     );

    //     console.log(`Scraped ${data.length} books`);
    //     console.log("Data saved to books.json");

    // } finally {

    //     await driver.quit();
    // }
}
async function getNextPageUrl(driver) {

    const nextButtons = await driver.findElements(
        By.css(".next a")
    );

    if (nextButtons.length === 0) {
        return null;
    }

    const nextUrl = await nextButtons[0]
        .getAttribute("href");

    return new URL(
        nextUrl,
        await driver.getCurrentUrl()
    ).href;
}


async function scrapeBooks() {

    const driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        let currentUrl =
            "https://books.toscrape.com/";

        const allBooks = [];

        while (currentUrl) {

            console.log(
                "Scraping:",
                currentUrl
            );

            await driver.get(currentUrl);


            const pageData =
                await scrapeCurrentPage(driver);


            allBooks.push(...pageData);


            console.log(
                `Books collected: ${allBooks.length}`
            );


            currentUrl =
                await getNextPageUrl(driver);
        }
        fs.writeFileSync(
            "books.json",
            JSON.stringify(
                allBooks,
                null,
                2
            )
        );


        console.log(
            `Finished. Total books: ${allBooks.length}`
        );

    } finally {

        await driver.quit();
    }
}


scrapeBooks();