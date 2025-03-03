import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from "dotenv";
import sequelize, { syncDataBase } from './database/dbsync';
import { initUsersModel, Users } from './database/Models/Users';
import { Tickets } from './database/Models/Tickets';
import { Messages } from './database/Models/Messages';
import { SupportsAdmins } from './database/Models/SupportAdmin';
// import { FAQ } from './database/Models/FAQ';
dotenv.config();
sequelize;

(async () => {
    await syncDataBase();
})();


const messageSupportId = new Map();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true
    }
}); // страрт бота

bot.setMyCommands([ // установка команд
    {
        command: '/start',
        description: 'Начало работы'
    },
    {
        command: '/menu',
        description: 'Открыть меню'
    }
])

//#region commands

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

    const userDb = await Users.findOne({ where: { user_id: msg.chat.id } });

    if (!userDb) {
        Users.create({
            user_id: msg.chat.id,
            username: msg.from!.username || 'undifined'
        })
    }
})

bot.onText(/\/menu/, async msg => {
    bot.sendMessage(msg.chat.id,
        'Меню приложения.\nЕсли вам надо обратится в тех поддержку, нажмите кнопку 🆘.\n Если вам надо посмотреть актуальные вопросы нажмите кнопку 🔖. \n Если вам надо отменить запрос, нажмите кнопку ❌',
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🆘',
                            callback_data: 'button_help_menu'
                        },
                        {
                            text: '🔖',
                            callback_data: 'button_request_menu'
                        },
                        {
                            text: '❌',
                            callback_data: 'button_close_request_menu'
                        }
                    ]
                ]
            }
        }
    )
})

//#region request buttons

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

        const ticketsDb = await Tickets.findOne({ where: { user_id: chatId, message_id_answer: (await message).message_id, ticket_id: parseInt(`${(await message).message_id}${chatId}`) } })

        if (!ticketsDb) {
            Tickets.create({
                user_id: chatId,
                message_id_answer: (await message).message_id,
                message_id_reply: 0,
                status: true,
                ticket_id: parseInt(`${(await message).message_id}${chatId}`),
                moderator: 0
            })
        }
        messageSupportId.set((await message).message_id, interaction.message?.chat.id);
    } else if (data?.replace(/[^a-zA-Z]/g, "") === 'buttonReplySupport') {
        const message = bot.sendMessage(chatId, 'Хорошо, ответьте в ответ на сообщение');
        const ticketsDb = await Tickets.findOne({ where: { ticket_id: data.replace(/\D/g, "") } });
        if (!ticketsDb) {
            bot.sendMessage(chatId, 'Произошла ошибка с запросом бд')
        } else {
            Tickets.update({
                moderator: chatId
            }, { where: { ticket_id: data.replace(/\D/g, "") } })
            messageSupportId.set((await message).message_id, ticketsDb.user_id);
        }

    } else if (data?.replace(/[^a-zA-Z]/g, "") === 'buttonDeclineReply') {
        bot.sendMessage(chatId, 'Хорошо, отменяю запрос');
        try {
            const ticketsDb = await Tickets.findOne({ where: { ticket_id: data.replace(/\D/g, "") } });
            bot.sendMessage(ticketsDb!.user_id, `Ваш запрос <pre> ${ticketsDb?.ticket_id} </pre> был отменен.`, { parse_mode: 'HTML' })
            if (ticketsDb) {
                await Tickets.update( { status: false }, { where: { ticket_id: data.replace(/\D/g, "")} } );
            }
        } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, `Произошла ошибка чек консоль`)
        }
    } else if (data === 'button_help_menu') {
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
    } else if (data === 'button_request_menu') {
        try {
            const ticketsDb = await Tickets.findAll({ where: { user_id: interaction.from.id }, limit: 25 });

            if (!ticketsDb) {
                bot.sendMessage(chatId, 'Вас нет в базе данных')
            } else {
                let message = ''
                    let buttonsMap = new Map();
                    let i = 0;
                    ticketsDb.forEach((ticket, index) => {
                        message += `\n№: ${index + 1}\nНомер заявки: ${ticket.ticket_id}`;
                        console.log(ticket.ticket_id)
                    });

                    bot.sendMessage(chatId, `Активные заявки\n${message}`, {
                        reply_markup: {
                            inline_keyboard: [[]]
                        }
                    })
            }
        } catch (err) {
            bot.sendMessage(chatId, 'Произошла ошибка')
            console.error(err)
        }
    } else if (data === 'button_close_request_menu') {
        try {
            const ticketsDb = await Tickets.findAll({ where: { user_id: chatId }, limit: 25 })

            if (ticketsDb.length > 0) {
                let message = 'Ваши тикеты:\n\n';
                ticketsDb.forEach((ticket, index) => {
                    message += `${index + 1}\n ID: ${ticket.ticket_id}\n Статус: ${ticket.status === true ? 'В работе' : 'Закрыт'}\n`;
                });

                bot.sendMessage(chatId, message);
            } else {
                bot.sendMessage(chatId, 'У вас нет тикетов.');
            }
        } catch { }
    }
})

//#region request message

bot.on('text', async msg => {
    if (!msg.reply_to_message) {
        return;
    };
    if (msg.reply_to_message.text === 'Хорошо, опишите свою проблему, ответом на сообщение') {
        try {
            const supportsAdmins = await SupportsAdmins.findAll();

            Tickets.update({
                ticket_id: parseInt(`${msg.message_id}${msg.chat.id}`)
            }, { where: { user_id: msg.chat.id } })

            for (let i = 0; i <= supportsAdmins.length; i++) {
                bot.sendMessage(supportsAdmins[i].user_admin_id, `Новый запрос о помощи\nПользователь: *${msg.from?.first_name}*\nТекст запроса:\n\`\`\` ${msg.text} \`\`\`\nId сообщения: ${msg.message_id}${msg.chat.id}`,
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
            }

            const addMessageSupport = await Users.findOne({ where: { user_id: msg.chat.id } });

            if (!addMessageSupport) {
                Users.create({
                    user_id: msg.chat.id,
                    username: msg.from?.first_name || 'undefined'
                });
            }

            function parseIntDb(): number {
                try {
                    const a = `${msg.reply_to_message?.message_id}${msg.chat.id}`;
                    return parseInt(a);
                } catch (err) {
                    console.error(err)
                return 0;
                }
            }

            const addTicketsSupport = await Tickets.findOne({ where: { user_id: parseIntDb() } })!;

            if (!addTicketsSupport) {
                if (parseIntDb() === 0) {
                    bot.sendMessage(msg.chat.id, 'Произошла ошибка')
                } else {
                    if ((await Tickets.findAll({ where: { user_id: msg.chat.id } })).length <= 25) {
                        await Tickets.update({
                            ticket_id: parseIntDb(),
                            status: true,
                            user_id: msg.chat.id,
                            message_id_reply: msg.message_id
                        }, { where: { user_id: msg.chat.id } }).then(res => console.log(res)).catch(err => console.error(err))
                        bot.sendMessage(msg.chat.id, `Я направил ваше обращение в чат поддержки, пожалуйста ожидайте ответа. Если вам не ответят через день проверьте статус завки в /menu\nВаш номер заявки ${msg.message_id}${msg.chat.id}`)
                    } else {
                        bot.sendMessage(msg.chat.id, 'У вас больше 25 запросов, дождись ответов по текущим вопросом или закройте их сами.')
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    } else if (msg.reply_to_message.text === 'Хорошо, ответьте в ответ на сообщение') {
        try {
            const ticketsDb = await Tickets.findOne({ where: { user_id: messageSupportId.get(msg.reply_to_message!.message_id), moderator: msg.chat.id } })

            if (!ticketsDb) {
                bot.sendMessage(msg.chat.id, 'Ошибочка')
            } else {
                bot.sendMessage(ticketsDb?.user_id, `Вам пришел ответ ${msg.text}`)
            }
        } catch (err) {
            bot.sendMessage(msg.chat.id, 'Произошла ошибка');
            console.error(err)
        }
    } else if (msg.reply_to_message.text === 'Напишите id пользователя ответом на сообщение и его право суперпользователя (true | false)') {
        const firstMessageSetting = msg.text?.split(' ')[0];
        const secondMessageSetting = msg.text?.split(' ')[1];
        try {
            const userDb = await Users.findOne({ where: { user_id: firstMessageSetting } });
            if (!userDb) {
                bot.sendMessage(msg.chat.id, 'Пользователь не пользовался ботом, ему нужно прописать команду /start, чтобы я добавил его в базу данных')
            } else {
                if ((secondMessageSetting === 'true') || (secondMessageSetting === 'false')) {
                    const supportsAdminsDb = await SupportsAdmins.findOne({ where: { user_admin_id: firstMessageSetting } });
                    if (!supportsAdminsDb) {
                        function papseBool(text: string): boolean {
                            const textParse = text === 'true' ? true : false; 
                            return textParse;
                        }
                        await SupportsAdmins.create(
                            {
                                user_admin_id: parseInt(firstMessageSetting!),
                                super_user: papseBool(secondMessageSetting)
                            }
                        )
                        bot.sendMessage(msg.chat.id, `Добавил пользователя ${firstMessageSetting} с правами супер пользователя ${papseBool(secondMessageSetting)}`);
                    } else {
                        bot.sendMessage(msg.chat.id, 'Этот пользователь уже есть в базе данных')
                    }
                } else {
                    bot.sendMessage(msg.chat.id, 'Вы неправильно указали второй параметр')
                }
            }
        } catch (err) {
            bot.sendMessage(msg.chat.id, 'Произошла ошибка');
            console.error(err)
        }
    }
})

bot.on('text', async msg => {
    if (msg.text?.toLowerCase() === 'добавить администратора adm') {
        try {
            const adminId = await SupportsAdmins.findOne({ where: { user_admin_id: msg.chat.id, super_user: true } });
            if ((msg.chat.id === 1911604621) || (msg.chat.id === adminId?.user_admin_id)) {
                bot.sendMessage(msg.chat.id, 'Напишите id пользователя ответом на сообщение и его право суперпользователя (true | false)')
            } else {
                bot.sendMessage(msg.chat.id, 'Вы не являетесь администратором')
            }
        } catch (err) {
            console.error(err);
            bot.sendMessage(msg.chat.id, 'Произошла ошибка')
        }
    } else if (msg.text?.toLowerCase() === 'запрос заявок adm') {
        try {
            const adminId = await SupportsAdmins.findOne({ where: { user_admin_id: msg.chat.id } });
            const ticketsDb = await Tickets.findAll({ where: { status: true }, limit: 25 });
            console.log(adminId!['user_admin_id'])
            console.log(msg.chat.id)
            if (msg.chat.id.toString() === adminId!['user_admin_id'].toString()) {
                if (!ticketsDb || (ticketsDb.length === 0)) {
                    bot.sendMessage(msg.chat.id, 'Нет активных заявок')
                } else {
                    let message = ''
                    let buttonsMap = new Map();
                    ticketsDb.forEach((ticket, index) => {
                        message += `\n№: ${index + 1}\nНомер заявки: ${ticket.ticket_id}`;
                    });

                    bot.sendMessage(msg.chat.id, `Активные заявки\n${message}`, {
                        reply_markup: {
                            inline_keyboard: [[]]
                        }
                    })
                    
                }
            } else {
                bot.sendMessage(msg.chat.id, 'Вы не являетесь администратором')
            }
        } catch (err) {
            console.error(err);
            bot.sendMessage(msg.chat.id, 'Произошла ошибка')
        }
    }
})

bot.on('polling_error', err => console.log(err.message));