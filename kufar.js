const kufar = require('./src/lib/kufar/index');

const main = async () => {
    const data = await kufar.getLatestAds();
    console.log(data);
    console.log("Найдено элементов" + data.length);
}

main();