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
                if (ChatChecker.rows.length > 0) {//создание чата с другим пользователем с поверкой на существование чата с ним
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
    
            const chats = users.rows.map(user => ({
                "chat_id": chatUsers[user.id],
                "id": user.id,
                "user_name": user.user_name
            }));
            const lastMessages = await Promise.all(chats.map(async (chat) => {
                const messageSearcher = await db.query(`SELECT content, time_stamp FROM messages WHERE chat_id = $1 ORDER BY time_stamp DESC LIMIT 1;`,
                    [chat.chat_id]);
                return messageSearcher.rows[0];
            }));
            
            let chatsWithLastMessage = chats.map((chat, index) => {
                if (lastMessages[index]){
                
                let lastMessage = lastMessages[index] ? lastMessages[index].content : '';
                let lastMessageTime = lastMessages[index] ? lastMessages[index].time_stamp : '';
                if (lastMessage.length > 200) {
                    lastMessage = lastMessage.substring(0, 30) + '...';
                }
                return {
                    ...chat,
                    last_message: lastMessage,
                    last_message_time: lastMessageTime
                };
                }
            });
            // Фильтруем чаты, где пользователь является user_id_2 и нет сообщений
            chatsWithLastMessage = chatsWithLastMessage.filter(chat => chat !== undefined);
            chatsWithLastMessage.sort((a, b) => {
                return new Date(b.last_message_time) - new Date(a.last_message_time);
            });
            res.status(200).json(chatsWithLastMessage);
        } else { return }
        } catch (err) {
            console.error('ошибка получения чатов ', err);
        }
    }
    

// TODO: доделать
    // async archiveChat(req, res) {
    //     const { chat_id } = req.body;
    //     try {
    //         const chat = await db.query(
    //             `SELECT * FROM chats WHERE id = $1;`,
    //             [chat_id])
    //         if (chat.rows.length > 0) {
    //             // Архивирование всех сообщений из чата
    //             await db.query(
    //                 `INSERT INTO ARCHIVEmessages SELECT * FROM messages WHERE chat_id = $1;`,
    //                 [chat_id])
    //             await db.query(
    //                 `DELETE FROM messages WHERE chat_id = $1;`,
    //                 [chat_id])

    //             // Архивирование самого чата
    //             await db.query(
    //                 `INSERT INTO ARCHIVEchats SELECT * FROM chats WHERE id = $1;`,
    //                 [chat_id])
    //             await db.query(
    //                 `DELETE FROM chats WHERE id = $1;`,
    //                 [chat_id])

    //             res.status(200).json({ message: "Чат успешно архивирован" })
    //         } else {
    //             res.status(404).json({ message: "Чат не найден" })
    //         }
    //     } catch (error) {
    //         console.error("ошибка при удалении и архивации чата ", err)
    //     }
    // }
}

module.exports = new ChatsController()
