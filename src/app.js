const kufar = require("./lib/kufar/index");
const logger = require("./lib/logger/index");

const processAds = async (filterBy) => {
  logger.info("Ads Processing: Start");
  const data = await kufar.getLatestAds();

  const todayOnly = data.filter((item) => item.date.includes(filterBy));
  // .map((item) => ({ date: item.date, price: item.price }))
  logger.info(
    `Ads Processing: Найдено ${todayOnly.length} объявлений за ${filterBy}`,
  );

  return todayOnly;
};

const getMessageTemplate = (ad) => {
  return `<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji> ${ad.parameters}
<b>${ad.date} / ${ad.price ? ad.price : "Договорная"}</b>
<a href="${ad.href}">Объявление</a>`;
};

const cleanString = (str) => {
  if (!str) {
    return "";
  }
  return str.toLowerCase().trim().replace(/\s/g, "");
};

const getUserId = (firstname, lastname, languageCode) => {
  return `${cleanString(firstname)}_${cleanString(lastname)}_${cleanString(languageCode)}`;
};

module.exports = {
  processAds,
  getMessageTemplate,
  getUserId,
};
