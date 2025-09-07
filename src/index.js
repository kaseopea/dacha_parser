const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const kufar = require("./lib/kufar/index");
const IDSCache = require("./lib/cache/index");

const MESSAGES = {
  pwdQuestion: "Кто здесь?",
  messageGranted: "Привет! Проверка каждые 10 мин. Отправь /stop чтобы остановить обновление.",
  startMessage: "Автоматические сообщения остановлены. Отправь /start чтобы начать снова",
  noActive: "Нет активных сообщений для остановки",
}

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4040;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_PWD = process.env.TELEGRAM_BOT_PWD;
const PARSE_MODE = 'HTML';

// Cache
const idsCache = new IDSCache();
idsCache.clearAllNow();

// Middleware
app.use(express.json());

// Replace with your actual Telegram Bot Token
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Store active timers for each user
const activeTimers = new Map();

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, MESSAGES.pwdQuestion);
});

// Handle text messages
bot.on("message", async (msg) => {
  // console.log(msg.from.first_name);
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands that aren't /start or /stop
  if (text.startsWith("/")) {
    return;
  }

  // Check if user sent password
  if (text.toLowerCase() === TELEGRAM_BOT_PWD) {
    bot.sendMessage(chatId,MESSAGES.messageGranted);

    // Clear any existing timer for this user
    if (activeTimers.has(chatId)) {
      clearInterval(activeTimers.get(chatId));
    }

    // Set up new interval for messages
    const intervalId = setInterval(async () => {
      const data = await kufar.getLatestAds();
      // const data = [];
      console.log(data.map(item => ({date: item.date, price: item.price})));
      const todayOnly = data.filter((item) => item.date.includes('Сегодня'));
      const sendToday = [];

      todayOnly.forEach((ad) => {
        if (!idsCache.hasString(ad.id)) {
          bot.sendMessage(chatId, `<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji> ${ad.parameters}
<b>${ad.date} / ${ad.price}</b>
<a href="${ad.href}">Объявление ${ad.id}</a>`, {
            parse_mode: PARSE_MODE,
          });
          sendToday.push(ad.id);
          idsCache.addCache(ad.id);
        }
      });

      // if (sendToday.length) {
      //   bot.sendMessage(
      //     chatId,
      //     `Send ${sendToday.length} ads. /stop to cancel. `
      //   );
      // }
    }, 30 * 1000); // 10 minutes in milliseconds 10 * 60 * 1000

    // Store the interval ID
    activeTimers.set(chatId, intervalId);
  }
});

// Handle /stop command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;

  if (activeTimers.has(chatId)) {
    clearInterval(activeTimers.get(chatId));
    activeTimers.delete(chatId);
    bot.sendMessage(
      chatId,
      MESSAGES.startMessage
    );
  } else {
    bot.sendMessage(chatId, MESSAGES.noActive);
  }
});

// Webhook setup (optional - for production)
// app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, (req, res) => {
//     bot.processUpdate(req.body);
//     res.sendStatus(200);
// });

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Bot is running", activeUsers: activeTimers.size });
});

// Error handling
bot.on("error", (error) => {
  console.error("Telegram Bot Error:", error);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bot is listening for messages...`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");

  // Clear all intervals
  activeTimers.forEach((intervalId, chatId) => {
    clearInterval(intervalId);
  });

  process.exit(0);
});
