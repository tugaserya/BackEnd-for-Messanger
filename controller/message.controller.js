const db =require('../db')




class messageController {

    async getNewMesseges(req, res) {
        const {chat_id} = req.body;
        const newMessageListener = (message_id, chat_id1, sender_id, recipient_id, content, time_of_day) => {
            if (chat_id === chat_id1) {
                res.status(200).json({
                    "message_id": message_id,
                    "sender_id": sender_id,
                    "recipient_id": recipient_id,
                    "time_stamp": new Date(time_of_day),
                    "content": content
                });
                // Отписываемся от события после отправки ответа
                emitter.removeListener('newMessage', newMessageListener);
            }
        };
        try {
            emitter.on('newMessage', newMessageListener);
        } catch (err) {
            console.error('ошибка отправки сообщения на клиент ', err);
            // Отписываемся от события в случае ошибки
            emitter.removeListener('newMessage', newMessageListener);
        }
    }

    // Ваш код для newMessage остается без изменений


    async newMessage(req, res, next) {
        try {
            const {chat_id, sender_id, recipient_id, content, time_of_day} = req.body;
            const time_stamp = new Date(time_of_day)
            const UserSearh = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2`,
                [sender_id, recipient_id])
            if (UserSearh.rows.length == 2 && moment(time_stamp, moment.ISO_8601, true).isValid()) {
                const result = await db.query(
                    `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp)
                     values ($1, $2, $3, $4, $5) RETURNING id;`,
                    [chat_id, sender_id, recipient_id, content, time_stamp])

                const message_id = result.rows[0].id;

                res.status(200).json({message: "Сообщение успешно отправлено"})

                emitter.emit('newMessage',
                    message_id,
                    chat_id,
                    sender_id,
                    recipient_id,
                    content,
                    time_of_day
                )
                
                await getAFKNewMesseges( message_id,
                    chat_id,
                    sender_id,
                    recipient_id,
                    content,
                    time_of_day
                )
                
                next();
            } else {
                res.status(418).json({message: "Я ЧАЙНИЧЕК"})
            }
        } catch (err) {
            console.error('ошибка получения сервером сообщения от клиента ', err);
        }
    }


    async getPastMessages(req, res) {
        const {chat_id, offset} = req.body;
        try {
            const messages = await db.query(
                `SELECT *
                 FROM messages
                 WHERE chat_id = $1
                 ORDER BY time_stamp DESC LIMIT 500
                 OFFSET $2;`,
                [chat_id, offset])
            if (messages.rows.length > 0) {
                res.status(200).json(messages.rows)
            } else {
                res.status(404).json({message: "Сообщений не найдено"})
            }
        } catch (err) {
            console.error("ошибка при получении сообщений из БД ", err);
            emitter.removeListener('newMessage', newMessageListener);
        }
    }


  
    

    async updateMessage(req, res) {
        const {message_id, new_content} = req.body;
        try {
            await db.query(
                `UPDATE messages
                 SET content = $1
                 WHERE id = $2;`,
                [new_content, message_id])
            res.status(200).json({message: "Сообщение успешно обновлено"})
        } catch (error) {
            console.error("ошибка обновления сообщения: ", err)
        }
    }

    async archiveMessage(req, res) {
        const {message_id} = req.body;
        try {
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
                res.status(200).json({message: "Сообщение успешно архивировано"})
            } else {
                res.status(404).json({message: "Сообщение не найдено"})
            }
        } catch (error) {
            console.error("ошибка при архивации и удалении сообщения ", err)
        }
    }
}

module.exports = new messageController()