//Works as of 28th March, 2025

const { launch } = require("puppeteer");
const path = require("path");

const getDiscordServerCount = async (discordToken) => {
    const browser = await launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--user-data-dir=${path.join(__dirname, 'user_data')}`
        ]
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'font', 'other'].includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });

    const bypassLocalStorageOverride = (page) =>
        page.evaluateOnNewDocument(() => {
            let __ls = localStorage;

            Object.defineProperty(window, "localStorage", {
                writable: false,
                configurable: false,
                value: __ls,
            });
        });

    bypassLocalStorageOverride(page);

    const botURL = "https://discord.com/oauth2/authorize?client_id=ID&permissions=8&integration_type=0&scope=bot+applications.commands";
    await page.goto(botURL, { waitUntil: "domcontentloaded" });

    await page.evaluate((token) => {
        localStorage.setItem("token", `"${token}"`);
    }, discordToken);

    await page.waitForSelector(".select__3f413.searchable__3f413");
    await page.click(".select__3f413.searchable__3f413");

    await page.waitForSelector(".option__3f413");
    await page.click(".option__3f413");

    await page.waitForSelector(".button__201d5.lookFilled__201d5.colorBrand__201d5.sizeMedium__201d5.grow__201d5");
    await page.click(".button__201d5.lookFilled__201d5.colorBrand__201d5.sizeMedium__201d5.grow__201d5");

    const x = await page.waitForSelector(".applicationDetails__94ab2");

    const x2 = await x.waitForSelector(".entry__94ab2:nth-of-type(3) .defaultColor__4bd52");

    const serverCount = await x2.evaluate((element) => {
        return element ? element.textContent.trim() : "Unknown";
    });

    await browser.close();

    return serverCount;
};

const discordToken = "TOKEN";
getDiscordServerCount(discordToken)
    .then((serverCount) => {
        console.log(`Server Count: ${serverCount}`);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
