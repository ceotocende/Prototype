import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true
    }
}
)

bot.on('text', async msg => {
    try {
        if (msg.text == '/start') {
            await bot.sendMessage(msg.chat.id, `Вы запустили бота!`);
        }
    }
    catch (error) {
        console.log(error);
    }
})

bot.on('callback_query', async user => {
    try {
        console.log(user)
    } catch (err) {
        console.log(err)
    }
})

bot.on('polling_error', err => console.log(err.message));