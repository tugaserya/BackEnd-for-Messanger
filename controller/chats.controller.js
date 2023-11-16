const db = require('../db')
const {UserChecker} = require("../userChecker");
class ChatsController {

    async createChat(req, res) {
        const { user_id_1, user_id_2, login, password } = req.body
        try {
            if(await UserChecker(login, password)){
            const idSercher = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2`,
                [user_id_1, user_id_2])
            if (idSercher.rows.length == 2) {
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

    async getChat(req, res) {
        const { id, login, password } = req.body;
        try {
            if(await UserChecker(login, password)){
            const idSearcher = await db.query(`SELECT id FROM users WHERE id = $1`, [id]);
    
            if (idSearcher.rows.length === 0) {
                return res.status(404).json({ message: "Your account doesn't exist!" });
            }
    
            const chatSearcher = await db.query(`SELECT * FROM chats where user_id_1 = $1 OR user_id_2 = $1;`, [id]);
    
            if (chatSearcher.rows.length === 0) {
                return res.status(404).json({ message: "Not found any chats" });
            }
    
            const chatUsers = chatSearcher.rows.reduce((acc, chat) => {
                const userId = chat.user_id_1 === id ? chat.user_id_2 : chat.user_id_1;
                acc[userId] = chat.id;
                return acc;
            }, {});
    
            const users = await db.query(`SELECT * FROM users WHERE id IN (${Object.keys(chatUsers).join()});`);
    
            const chats = [];
            for (let user of users.rows) {
                const chatId = chatUsers[user.id];
                const messageSearcher = await db.query(`SELECT content, time_stamp FROM messages WHERE chat_id = $1 ORDER BY time_stamp DESC LIMIT 1;`, [chatId]);
                if (messageSearcher.rows.length > 0 || user.id !== id) {
                    chats.push({
                        "chat_id": chatId,
                        "id": user.id,
                        "user_name": user.user_name,
                        "last_message": messageSearcher.rows[0] ? messageSearcher.rows[0].content : '',
                        "last_message_time": messageSearcher.rows[0] ? messageSearcher.rows[0].time_stamp : ''
                    });
                }
            }
    
            chats.sort((a, b) => {
                return new Date(b.last_message_time) - new Date(a.last_message_time);
            });
            res.status(200).json(chats);
        } else { return }
        } catch (err) {
            console.error('ошибка получения чатов ', err);
        }
    }
}

module.exports = new ChatsController()
