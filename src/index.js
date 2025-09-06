const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const kufar = require('./lib/kufar/index');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4040;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_PWD = process.env.TELEGRAM_BOT_PWD;


// Middleware
app.use(express.json());

// Replace with your actual Telegram Bot Token
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Store active timers for each user
const activeTimers = new Map();

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Who's there?");
});

// Handle text messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands that aren't /start or /stop
    if (text.startsWith('/')) {
        return;
    }

    // Check if user sent "lessy"
    if (text.toLowerCase() === TELEGRAM_BOT_PWD) {
        bot.sendMessage(chatId, "Access granted! You'll receive messages every 10 minutes. Send /stop to cancel.");
        
        // Clear any existing timer for this user
        if (activeTimers.has(chatId)) {
            clearInterval(activeTimers.get(chatId));
        }

        // Set up new interval for messages
        const intervalId = setInterval(async() => {
            const ads = await kufar.getLatestAds();
            bot.sendMessage(chatId, `This is your automated message every 10 minutes! Send /stop to cancel. ${ads}`);
        }, 3 * 1000); // 10 * 60 * 1000 10 minutes in milliseconds

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
        bot.sendMessage(chatId, "Automated messages stopped. Send /start to begin again.");
    } else {
        bot.sendMessage(chatId, "No active automated messages to stop.");
    }
});

// Webhook setup (optional - for production)
// app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, (req, res) => {
//     bot.processUpdate(req.body);
//     res.sendStatus(200);
// });

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Bot is running', activeUsers: activeTimers.size });
});

// Error handling
bot.on('error', (error) => {
    console.error('Telegram Bot Error:', error);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bot is listening for messages...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    
    // Clear all intervals
    activeTimers.forEach((intervalId, chatId) => {
        clearInterval(intervalId);
    });
    
    process.exit(0);
});