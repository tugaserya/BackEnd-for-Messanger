const db = require('../db')
const moment = require('moment')
const fs = require("fs").promises;
const path = require("path");

class MessageCases {

    async NewMessage(message_data) {
        try {
            const { chat_id, sender_id, recipient_id, content, time_of_day, file_name, service_file } = JSON.parse(message_data)
            const time_stamp = new Date(time_of_day);
            const UserSearch = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2;`, [sender_id, recipient_id]);
            if (UserSearch.rows.length === 2 && moment(time_stamp, moment.ISO_8601, true).isValid()) {
                let fileType = 'other';
                if (!(file_name === "" && service_file === "")) {
                    const getFileType = (filename) => {
                        const ext = path.extname(filename).toLowerCase();
                        const types = {
                            image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
                            video: ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'],
                            music: ['.mp3', '.wav', '.aac', '.flac', '.ogg']
                        };

                        switch (true) {
                            case types.image.includes(ext):
                                return 'image';
                            case types.video.includes(ext):
                                return 'video';
                            case types.music.includes(ext):
                                return 'music';
                            default:
                                return 'other';
                        }
                    }
                    fileType = getFileType(file_name);
                    const sourcePath = path.join(__dirname, '../../uploads/temp/', service_file);
                    const targetPath = path.join(__dirname, '../../uploads/' + fileType + '/', service_file);
                    async function fileExists(path) {
                        try {
                            await fs.access(path);
                            return true;
                        } catch {
                            return false;
                        }
                    }
                    if (await fileExists(sourcePath)) {
                        await fs.rename(sourcePath, targetPath);
                    } else {
                        throw new Error(`File ${sourcePath} does not exist`);
                        return
                    }
                }
                const result = await db.query(
                    `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp, is_readed, is_edited, originalfile, file_type, file)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;`,
                    [chat_id, sender_id, recipient_id, content, time_stamp, false, false, file_name, fileType, service_file]
                );

                const message = {
                    message_id: result.rows[0].id,
                    chat_id,
                    sender_id,
                    recipient_id,
                    content,
                    time_of_day: result.rows[0].time_stamp,
                    is_readed: result.rows[0].is_readed,
                    is_edited: result.rows[0].is_edited,
                    file_name,
                    fileType,
                    type: "new_message"
                }
                return message;
            } else {
                throw new Error('One or both users not found');
            }
        } catch (err) {
            console.error(err);
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
                originalfile: updated_message.rows[0].originalfile,
                fyle_type: updated_message.rows[0].file_type,
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

    async FileMessage(message_data){
        try{
            const {id, base64} = JSON.parse(message_data)
            const buffer = Buffer.from(base64, 'base64');
            const file_rows = db.query(`SELECT * FROM messages WHERE id = $1;`,[id]);
            const new_file_name = Date.now() + "_" + file_rows.rows[0].originalfile;
            if(file_rows.rows.length > 0) {
                fs.writeFile(path.join(__dirname, path.join(__dirname, '../../uploads/' + file_rows.rows[0].fyle_type, new_file_name), buffer, (err) => {
                    if (err) console.error(err);
                }))
                await db.query(`UPDATE messages SET file = $1 WHERE id = $2;`, [new_file_name, id]);
                return base64
            }else{return}
        } catch (err){
            console.error(err);
        }
    }
}
module.exports = new MessageCases()