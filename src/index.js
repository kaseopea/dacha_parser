const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const MESSAGES = require("./config/messages");
const userCache = require("./lib/cache/user-cache");
const logger = require("./lib/logger/index");
const App = require("./app");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4040;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_PWD = process.env.TELEGRAM_BOT_PWD;
const PARSE_MODE = "HTML";
const LISTEN_INTERVAL_TEST = 30 * 1000;
const LISTEN_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

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
  const userId = App.getUserId(
    msg.from.first_name,
    msg.from.last_name,
    msg.from.language_code,
  );
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands that aren't /start or /stop
  if (text.startsWith("/")) {
    return;
  } else {
    logger.info(`${text} message for ${userId}`);
  }

  // Check if user sent password
  if (text.toLowerCase() === TELEGRAM_BOT_PWD) {
    logger.info(`PWD is correct for ${userId}`);
    bot.sendMessage(chatId, MESSAGES.messageGranted);

    // Clear any existing timer for this user
    if (activeTimers.has(chatId)) {
      clearInterval(activeTimers.get(chatId));
    }

    // Set up new interval for messages
    const intervalId = setInterval(async () => {
      const sendToday = [];
      const todayAds = await App.processAds("Сегодня");
      const messagePromises = [];

      todayAds.forEach((ad) => {
        if (!userCache.userHasString(userId, ad.id)) {
          messagePromises.push(
            bot.sendMessage(chatId, App.getMessageTemplate(ad), {
              parse_mode: PARSE_MODE,
            }),
          );
          sendToday.push(ad.id);
          userCache.addUserStrings(userId, ad.id);
        }
      });

      Promise.all(messagePromises).then(() => {
        if (sendToday.length) {
          bot.sendMessage(
            chatId,
            `Отправлено ${sendToday.length} объявлений. /stop для остановки мониторинга. `,
          );
        }
      });
    }, LISTEN_INTERVAL);

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
    bot.sendMessage(chatId, MESSAGES.startMessage);
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

// Health check endpoint
app.get("/cache", (req, res) => {
  res.json({ status: "Cache status", cache: userCache.getGlobalStats() });
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
