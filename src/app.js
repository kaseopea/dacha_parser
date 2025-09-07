const kufar = require("./lib/kufar/index");

const processAds = async (filterBy) => {
  const data = await kufar.getLatestAds();

  console.log(data.map((item) => ({ date: item.date, price: item.price })));

  const todayOnly = data.filter((item) => item.date.includes(filterBy));
  return todayOnly;
};

const getMessageTemplate = (ad) => {
  return `<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji> ${ad.parameters}
<b>${ad.date} / ${ad.price ? ad.price : "Договорная"}</b>
<a href="${ad.href}">Объявление</a>`;
};

module.exports = {
  processAds,
  getMessageTemplate,
};
