const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const BASE_URL =
  "https://re.kufar.by/l/gomelskij-rajon/kupit/dom?cur=USD&gtsy=country-belarus~province-gomelskaja_oblast~area-gomelskij_rajon";

const extractId = (href) => {
  const urlObj = new URL(href);
  const pathSegments = urlObj.pathname.split("/");
  return pathSegments[pathSegments.length - 1];
};

module.exports = {
  getLatestAds: async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    const content = await page.content();
    const $ = cheerio.load(content);
    const data = [];

    const $items = $('[class*="styles_cards"]')
      .find("section > a")
      .each((index, element) => {
        const $card = $(element);
        const cardData = {
          id: extractId($card.attr("href")),
          href: $card.attr("href"),
          address: $card.find('[class*="styles_address"]').text(),
          price: $card.find('[class*="styles_price__usd"]').text(),
          parameters: $card.find('[class*="styles_parameters"]').text(),
          date: $card.find('[class*="styles_date"]').text(),
          body: $card.find('[class*="styles_body"]').text(),
        };
        data.push(cardData);
      });

    await browser.close();

    // filter data
    const filteredData = data.filter((item) => item.date.includes("Сегодня"));

    return filteredData;
  },
};
