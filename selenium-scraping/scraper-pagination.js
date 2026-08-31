const { Builder, By, until } =
    require("selenium-webdriver");


async function testPagination() {

    const driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        const startUrl =
            "https://www.goodfirms.co/directory/languages/top-software-development-companies";

        await driver.get(startUrl);


        // Wait for company cards
        await driver.wait(
            until.elementLocated(
                By.css("li.firm-wrapper")
            ),
            10000
        );


        // Find Next button
        const nextButtons =
            await driver.findElements(
                By.css("li.next-page a")
            );


        console.log(
            "Next buttons:",
            nextButtons.length
        );


        if (nextButtons.length > 0) {

            const relativeUrl =
                await nextButtons[0]
                    .getAttribute("href");

            console.log(
                "Relative URL:",
                relativeUrl
            );


            const currentUrl =
                await driver.getCurrentUrl();


            const nextUrl = new URL(
                relativeUrl,
                currentUrl
            ).href;


            console.log(
                "Full Next URL:",
                nextUrl
            );
        }

    } finally {

        await driver.quit();
    }
}


testPagination();