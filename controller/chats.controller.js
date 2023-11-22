const db = require('../db')
const {UserChecker} = require("../userChecker");
class ChatsController {

    async createChat(req, res) {
        const { user_id_1, user_id_2, login, password } = req.body
        try {
            if(await UserChecker(user_id_1, login, password)){
            const idSercher = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2`,
                [user_id_1, user_id_2])
            if (idSercher.rows.length === 2) {
                const ChatChecker = await db.query(
                    `SELECT * FROM chats WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1);`,
                    [user_id_1, user_id_2])
                if (ChatChecker.rows.length > 0) {
                    res.status(409).json({ message: 'This chat alredy exist!' })
                } else {
                    await db.query(`INSERT INTO chats (user_id_1, user_id_2) values ($1, $2)`, [user_id_1, user_id_2])
                    res.status(200).json({ message: 'You create an a new chat!' })
                }
            } else { res.status(404).json({ message: "Your account isn't exist!" }) }
        } else { return }
        } catch (err) {
            console.error('ошибка при создании чата ', err);
        }
    }

}

module.exports = new ChatsController()
