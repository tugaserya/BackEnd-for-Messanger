const db = require('../db')

class ChatCases {

async GetChats (message_data){
    try{
        const { user_id } = JSON.parse(message_data)
        const chats = await db.query(
            `SELECT * FROM chats WHERE user_id_1 = $1 OR user_id_2 = $1;`,
            [user_id])
            if (chats.rows.length > 0) {
                const chatUsers = chats.rows.reduce((acc, chat) => {
                    const userId = chat.user_id_1 === id ? chat.user_id_2 : chat.user_id_1;
                    acc[userId] = chat.id;
                    return acc;
                }, {});
                const users = await db.query(`SELECT * FROM users WHERE id IN (${Object.keys(chatUsers).join()});`);
                const chats = [];
            for (let user of users.rows) {
                const chatId = chatUsers[user.id];
                const messageSearcher = await db.query(`SELECT content, time_stamp FROM messages WHERE chat_id = $1 ORDER BY time_stamp DESC LIMIT 1;`, [chatId]);
                const not_readed_messages = await db.query(`SELECT id FROM messages WHERE chat_id = $1 AND is_readed = false;`, [chatId])
                if (messageSearcher.rows.length > 0 || user.id !== id) {
                    chats.push({
                        "chat_id": chatId,
                        "id": user.id,
                        "user_name": user.user_name,
                        "last_message": messageSearcher.rows[0] ? messageSearcher.rows[0].content : '',
                        "last_message_time": messageSearcher.rows[0] ? messageSearcher.rows[0].time_stamp : '',
                        "not_readed_messages": not_readed_messages.rows.length
                    });
                }
            }
            chats.sort((a, b) => {
                return new Date(b.last_message_time) - new Date(a.last_message_time);
            });
            return chats
            }
    }catch(err){
        console.error(err);
    }
}

async ArchiveChat(message_data) {
    try{
        const { chat_id, user_id } = JSON.parse(message_data)
        const chat = await db.query(
                    `SELECT * FROM chats WHERE id = $1;`,
                    [chat_id])
            if (chat.rows.length > 0 && (chat.rows[0].user_id_1 == user_id || chat.rows[0].user_id_2 == user_id)) {
                await db.query(
                    `INSERT INTO ARCHIVEmessages SELECT * FROM messages WHERE chat_id = $1;`,
                    [chat_id])
                await db.query(
                    `DELETE FROM messages WHERE chat_id = $1;`,
                    [chat_id])
                await db.query(
                    `INSERT INTO ARCHIVEchats SELECT * FROM chats WHERE id = $1 RETURNING *;`,
                    [chat_id])
                await db.query(
                    `DELETE FROM chats WHERE id = $1;`,
                    [chat_id])
                return chat
                }
        }catch (err){
        console.error(err)
            }
    }
}

module.exports = new ChatCases()