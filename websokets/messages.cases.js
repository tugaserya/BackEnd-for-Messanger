const db = require('./db')


class MessageCases{

async NewMessage(message_data) {
    const { chat_id, sender_id, recipient_id, content, time_of_day } = JSON.parse(message_data)
    const time_stamp = new Date(time_of_day);
    const UserSearh = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2;`, [sender_id, recipient_id]);
    if (UserSearh.rows.length == 2 && moment(time_stamp, moment.ISO_8601, true).isValid()) {
        const result = await db.query(
            `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp, is_readed, is_edited)
            values ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
            [chat_id, sender_id, recipient_id, content, time_stamp, false, false]
        );
        const message_data = JSON.stringify({
            message_id: result.rows[0].id,
            chat_id,
            sender_id,
            recipient_id,
            content,
            time_of_day: result.rows[0].time_stamp,
            is_readed: result.rows[0].is_readed,
            is_edited: result.rows[0].is_edited,
            type: "new_message"})
            return message_data;
        }
    }

async UpdateMessage(message_data, login){
    const { message_id, new_content } = JSON.parse(message_data)
    const user_id = await db.query(`SELECT id FROM users WHERE login = $1;`, [login])
    const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
    if (user_id.rows[0].id == message.rows[0].sender_id) {
        const updated_message = await db.query(
        `UPDATE messages
        SET content = $1, is_edited = true
        WHERE id = $2 RETURNING *;`,
        [new_content, message_id])

        const message_data = JSON.stringify({message_id: updated_message.rows[0].id,
            sender_id: updated_message.rows[0].sender_id,
            chat_id: updated_message.rows[0].chat_id,
            time_of_day: updated_message.rows[0].time_stamp,
            new_content: updated_message.rows[0].content,
            is_edited: updated_message.rows[0].is_edited,
            type: "updated_message"})
        return message_data
        }
    }

async ArchiveMessage(message_data, login){
    const { message_id } = JSON.parse(message_data)
    const user_id = await db.query(`SELECT id FROM users WHERE login = $1;`, [login])
    const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
    if (user_id.rows[0].id == message.rows[0].sender_id || user_id.rows[0].id == message.rows[0].recipient_id) {
        const message = await db.query(
            `SELECT *
            FROM messages
            WHERE id = $1;`,
            [message_id])
        if (message.rows.length > 0) {
            await db.query(
                `INSERT INTO ARCHIVEmessages
                SELECT *
                FROM messages
                WHERE id = $1;`,
                [message_id])
            await db.query(
                `DELETE
                FROM messages
                WHERE id = $1;`,
                [message_id])
            }
        return message
        } else { return }
    }
}
module.exports = new MessageCases()