const db = require('../db')

class ChatCases {

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