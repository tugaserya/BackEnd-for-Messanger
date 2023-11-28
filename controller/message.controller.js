const db = require('../db')
const { UserChecker } = require("../userChecker");



class messageController {

    async getPastMessages(req, res) {
        const { chat_id, offset, id, login, password } = req.body;
        try {
            if (await UserChecker(id, login, password)) {
                const messages = await db.query(
                    `SELECT * FROM messages WHERE chat_id = $1 ORDER BY time_stamp DESC LIMIT 300 OFFSET $2;`,
                    [chat_id, offset])
                if (messages.rows.length > 0) {
                    res.status(200).json(messages.rows)
                } else {
                    res.status(404).json({ message: "Сообщений не найдено" })
                }
            } else { return }
        } catch (err) {
            console.error("ошибка при получении сообщений из БД ", err);
        }
    }
}

module.exports = new messageController()
