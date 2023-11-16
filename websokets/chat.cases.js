const db = require('../db')

class ChatCases {

async ArchiveChat(message_data) {
    const { chat_id } = JSON.parse(message_data)
    const chat = await db.query(
                    `SELECT * FROM chats WHERE id = $1;`,
                    [chat_id])
                if (chat.rows.length > 0) {
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
    }
}

module.exports = new ChatCases()