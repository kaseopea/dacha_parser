const kufar = require("./src/lib/kufar/index");
const IDSCache = require("./src/lib/cache/index");

const idsCache = new IDSCache();
// idsCache.clearAllNow();

const main = async () => {
  const data = await kufar.getLatestAds();
  // console.log(data);

  // filter today only ads
  const todayOnly = data.filter((item) => item.date.includes("Сегодня"));
  console.log(todayOnly);
  // console.log(idsCache.getTodayKey());
  // console.log(idsCache.getCache());

  const todayIds = todayOnly.map((item) => item.id);
  // console.log('todayIds', todayIds);
  // idsCache.addCache(todayIds);

  todayOnly.forEach((ad) => {
    if (!idsCache.hasString(ad.id)) {
      console.log("#### Sending ad " + ad.id);
      idsCache.addCache(ad.id);
    }
  });

  console.log(idsCache.getCache());
  console.log(idsCache.getStats());

  console.log("Найдено элементов " + todayIds.length);
};

// main();
