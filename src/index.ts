import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from "dotenv";
import sequelize, { syncDataBase } from './database/dbsync';
import { initUsersModel, Users } from './database/Models/Users';
import { Tickets } from './database/Models/Tickets';
// import { FAQ } from './database/Models/FAQ';
dotenv.config();
sequelize;
const a = (async () => {
    console.log('asdfasdf')
    await syncDataBase();
})();

const messageSupportId = new Map();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true
    }
}
)

bot.onText(/\/start/, async msg => {
    await bot.sendMessage(msg.chat.id, `Привет, я бот поддержки.\nНажмите кнопку снизу если вам нужна помощь.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🆘 Мне нужна помощь',
                        callback_data: 'button_help'
                    },
                    {
                        text: `Закрыть меню`,
                        callback_data: 'button_close_help_button'
                    }
                ]
            ]
        },
    });
})

bot.on('callback_query', async interaction => {
    const chatId = interaction.message!.chat.id;
    const data = interaction.data;

    if (data === 'button_help') {
        bot.sendMessage(chatId, 'С чем именно вам нужна помощь?', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `Мне нужна помощь с тех специалистом`,
                            callback_data: `button_tech_spec_support`
                        }
                    ]
                ]
            }
        })
    } else if (data === "button_tech_spec_support") {
        const message = bot.sendMessage(chatId, 'Хорошо, опишите свою проблему, ответом на сообщение');

        messageSupportId.set((await message).message_id, (await message).message_id)
    } else if (data?.replace(/[^a-zA-Z]/g, "") === 'buttonReplySupport') {
        bot.sendMessage(chatId, 'Хорошо, ответье в ответ на сообщение')
    } else if (data?.replace(/[^a-zA-Z]/g, "") === 'buttonDeclineReply') {
        bot.sendMessage(chatId, 'Хорошо, отменяю запрос');
        try {
            const ticketsDb = await Tickets.findOne({ where: { ticket_id: data.replace(/\D/g, "") }});
            bot.sendMessage(ticketsDb!.user_id, `Ваш запрос <pre> ${ticketsDb?.ticket_id} </pre> был отменен.`, { parse_mode: 'HTML' })
            if (ticketsDb) {
                await Tickets.destroy({ where: { ticket_id: data.replace(/\D/g, "")  } });
            }
        } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, `Произошла ошибка чек консоль`)
        }
    }
})

//чел выбирает с чем нужна ему помощь и его сразу переводят на оператора.

bot.on('text', async msg => {
    if (messageSupportId.get(msg.reply_to_message?.message_id)) {
        try {
            bot.sendMessage(1911604621, `Новый запрос о помощи\nПользователь: *${msg.from?.first_name}*\nТекст запроса:\n\`\`\` ${msg.text} \`\`\`\nId сообщения: ${msg.message_id}${msg.chat.id}`,
                {
                    parse_mode: 'MarkdownV2',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '✅ Ответить на запрос',
                                    callback_data: `buttonReplySupport_${msg.message_id}${msg.chat.id}`
                                },
                                {
                                    text: `❌ Отменить запрос`,
                                    callback_data: `buttonDeclineReply_${msg.message_id}${msg.chat.id}`
                                }
                            ]
                        ]
                    }
                    
                });

            const addMessageSupport = await Users.findOne({ where: { user_id: msg.chat.id } });

            if (!addMessageSupport) {
                Users.create({
                    user_id: msg.chat.id,
                    username: msg.from?.first_name || 'undefined'
                });
            }

            function parseIntDb(): number {
                try {
                    const a = `${msg.message_id}${msg.chat.id}`;
                    return parseInt(a);
                } catch (err) {
                    console.error(err)
                    return 0;
                }
            }

            const addTicketsSupport = await Tickets.findOne({ where: { user_id: parseIntDb() } });

            if (!addTicketsSupport) {
                if (parseIntDb() === 0) {
                    Tickets.create({
                        ticket_id: 0,
                        user_id: 0,
                        status: true,
                        message_id: 0
                    })
                } else {
                    Tickets.create({
                        ticket_id: parseIntDb(),
                        status: true,
                        user_id: msg.chat.id,
                        message_id: msg.message_id
                    })
                }
            }

            bot.sendMessage(msg.chat.id, `Я направил ваше обращение в чат поддержки, пожалуйста ожидайте ответа. Если вам не ответят через день проверьте статус завки в /menu\nВаш номер заявки ${msg.message_id}${msg.chat.id}`)

        } catch (err) {
            console.error(err);
        }
    }
})

bot.on('polling_error', err => console.log(err.message));