const db = require('../db')
const {UserChecker} = require("../userChecker");



class messageController {



    async getPastMessages(req, res) {
        const { chat_id, offset, login, password} = req.body;
        try {
            if (await UserChecker(login, password)) {
                const messages = await db.query(
                    `SELECT * FROM messages WHERE chat_id = $1
                 ORDER BY time_stamp DESC LIMIT 300
                 OFFSET $2;`,
                    [chat_id, offset])
                if (messages.rows.length > 0) {
                    res.status(200).json(messages.rows)
                } else {
                    res.status(404).json({ message: "Сообщений не найдено" })
                }
            } else { return }
        } catch (err) {
            console.error("ошибка при получении сообщений из БД ", err);
            emitter.removeListener('newMessage', newMessageListener);
        }
    }




//TODO: доделать
    async updateMessage(req, res){
        const { message_id, new_content, login, password } = req.body;
        try {
            if (await UserChecker(login, password)) {
            await db.query(
                `UPDATE messages
                 SET content = $1
                 WHERE id = $2;`,
                [new_content, message_id])
            res.status(200).json({ message: "Сообщение успешно обновлено" })
            } else { return }
        } catch (error) {
            console.error("ошибка обновления сообщения: ", err)
        }
    }

    async archiveMessage(req, res) {
        const { message_id, login, password } = req.body;
        try {
            if (await UserChecker(login, password)) {
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
                res.status(200).json({ message: "Сообщение успешно архивировано" })
            } else {
                res.status(404).json({ message: "Сообщение не найдено" })
            }
        } else { return }
        } catch (error) {
            console.error("ошибка при архивации и удалении сообщения ", err)
        }
    }
}

module.exports = new messageController()
