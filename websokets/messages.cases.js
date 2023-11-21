const db = require('../db')
const moment = require('moment')
const fs = require("fs");
const path = require("path");

class MessageCases {

async NewMessage(message_data) {
    try{
        const { chat_id, sender_id, recipient_id, content, time_of_day } = JSON.parse(message_data)
        const time_stamp = new Date(time_of_day);
        const UserSearh = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2;`, [sender_id, recipient_id]);
        if (UserSearh.rows.length === 2 && moment(time_stamp, moment.ISO_8601, true).isValid()) {
            const result = await db.query(
                `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp, is_readed, is_edited)
                values ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
                [chat_id, sender_id, recipient_id, content, time_stamp, false, false]
            );
            const message_data = {
                message_id: result.rows[0].id,
                chat_id,
                sender_id,
                recipient_id,
                content,
                time_of_day: result.rows[0].time_stamp,
                is_readed: result.rows[0].is_readed,
                is_edited: result.rows[0].is_edited,
                type: "new_message"}
                return message_data;
            }
        }catch (err){
            console.error(err)
        }
    }

async UpdateMessage(message_data, login){
    try{
        const { message_id, new_content } = JSON.parse(message_data)
        const user_id = await db.query(`SELECT id FROM users WHERE login = $1;`, [login])
        const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
        if (user_id.rows[0].id === message.rows[0].sender_id) {
            const updated_message = await db.query(
            `UPDATE messages SET content = $1, is_edited = true WHERE id = $2 RETURNING *;`,
            [new_content, message_id])
            const message = {
                message_id: updated_message.rows[0].id,
                sender_id: updated_message.rows[0].sender_id,
                recipient_id: updated_message.rows[0].recipient_id,
                chat_id: updated_message.rows[0].chat_id,
                time_of_day: updated_message.rows[0].time_stamp,
                new_content: updated_message.rows[0].content,
                is_edited: updated_message.rows[0].is_edited,
                type: "updated_message"}
            return message
            }
        }catch (err){
            console.error(err);
        }
    }

async IsReadedMessage (message_data){
    try{
        const { message_id } = JSON.parse(message_data)
        const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
        if(message.rows.length > 0 && message.rows[0].is_readed === false){
            const is_readed = await db.query(`UPDATE messages SET is_readed = true WHERE id = $1 RETURNING *`, [message_id])
            const readed_message = {
                message_id: message.rows[0].id,
                is_readed: is_readed.rows[0].is_readed,
                recipient_id: message.rows[0].recipient_id,
                sender_id: message.rows[0].sender_id,
                type: "readed_message"
            }
            return readed_message
        } else {
            const readed_message = {
                message_id: message.rows[0].id,
                is_readed: message.rows[0].is_readed,
                recipient_id: message.rows[0].recipient_id,
                sender_id: message.rows[0].sender_id,
                type: "readed_message"
            }
            return readed_message
        }
    }catch (err){
        console.error(err);
    }
}

async ArchiveMessage(message_data, login){
    try{
    const { deleting_message_id } = JSON.parse(message_data)
    const user_id = await db.query(`SELECT id FROM users WHERE login = $1;`, [login])
    const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [deleting_message_id])
    if (user_id.rows[0].id === message.rows[0].sender_id || user_id.rows[0].id === message.rows[0].recipient_id) {
        const message = await db.query(
            `SELECT * FROM messages WHERE id = $1;`,
            [deleting_message_id])
        if (message.rows.length > 0) {
            await db.query(
                `INSERT INTO ARCHIVEmessages SELECT * FROM messages WHERE id = $1;`,
                [deleting_message_id])
            await db.query(
                `DELETE FROM messages WHERE id = $1;`,
                [deleting_message_id])
            }
        return message
        } else { return }
    } catch (err){
        console.error(err);
    }
}

async FileMessage(message_data) {
    try {
        const {file, file_name, file_type} = JSON.parse(message_data)
        let file_rows = {}
        const new_message = await this.NewMessage(message_data)
        console.log('work 1')
        if (file && file_type) {
            console.log('work 2')
            switch (file_type) {
                case 'text':
                    if (file instanceof Buffer) {
                        console.log('work 3')
                        const new_file_name = Date.now() + file_name
                        let file_path = path.join(__dirname, '../../uploads/docs/', new_file_name)
                        await fs.writeFile(file_path, file, (err) => {
                            if (err) {
                                console.error(err);
                                return
                            }
                        });
                        await db.query(`UPDATE messages SET file = $1, file_type = $2 WHERE id = $3;`, [new_file_name, file_type, message.message_id])
                        file_rows = {
                            file: file,
                            file_type: file_type
                        }
                    }
                    break;
                case 'media':
                    if (file instanceof Buffer) {
                        const new_file_name = Date.now() + file_name
                        let file_path = path.join(__dirname, '../../uploads/media/', new_file_name)
                        await fs.writeFile(file_path, file, (err) => {
                            if (err) console.error(err)
                        });
                        await db.query(`UPDATE messages SET file = $1, file_type = $2 WHERE id = $3;`, [new_file_name, file_type, message.message_id])
                        file_rows = {
                            file: file,
                            file_type: file_type
                        }
                    }
                    break;
                case 'image':
                    if (file instanceof Buffer) {
                        const new_file_name = Date.now() + file_name
                        let file_path = path.join(__dirname, '../../uploads/image/', new_file_name)
                        await fs.writeFile(file_path, file, (err) => {
                            if (err) console.error(err)
                        });
                        await db.query(`UPDATE messages SET file = $1, file_type = $2 WHERE id = $3;`, [new_file_name, file_type, message.message_id])
                        file_rows = {
                            file: file,
                            file_type: file_type
                        }
                    }
                    break;
                case 'other':
                    if (file instanceof Buffer) {
                        const new_file_name = Date.now() + file_name
                        let file_path = path.join(__dirname, '../../uploads/other/', new_file_name)
                        await fs.writeFile(file_path, file, (err) => {
                            if (err) console.error(err)
                        });
                        await db.query(`UPDATE messages SET file = $1, file_type = $2 WHERE id = $3;`, [new_file_name, file_type, message.message_id])
                        file_rows = {
                            file: file,
                            file_type: file_type
                        }
                    }
                    break;
            }
            const full_message = {
                message: new_message,
                file_rows: file_rows
            }
            return full_message
        }
    } catch(err)
        {
            console.error(err)
        }
    }
}
module.exports = new MessageCases()