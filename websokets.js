const WebSocket = require('ws');
const { Server } = WebSocket;
const db = require('./db')
const moment = require('moment')
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json")
const { UserChecker } = require("./userChecker");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const clients = new Map();

const getNotification = async (sender_id, recipient_id, content) => {
    const userDeviceToken = await db.query(`SELECT * FROM users WHERE id = $1;`, [recipient_id])
    const user_name = await db.query(`SELECT user_name FROM users   WHERE id = $1`, [sender_id]);
    const message = {
        notification: {
            title: user_name.rows[0].user_name,
            body: content
        },
        data: {
            "content": content
        },
        token: userDeviceToken.rows[0].fcmtoken
    };
    admin.messaging().send(message)
        .then((response) => {
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

module.exports.initWebSocket = (server) => {
    const wss = new Server({ server });

    wss.on('connection', async (ws, req) => {
        const login = decodeURIComponent(req.url.split(/login=|&password/)[1])
        const password = req.url.split('&password=')[1]
        if (await UserChecker(login, password)) {
            ws.on('message', async (message) => {
                try {
                    const { chat_id, sender_id, recipient_id, content, time_of_day, type } = JSON.parse(message);
                    console.log(type)
                    switch (type) {
                        case 'new_message':
                            const time_stamp = new Date(time_of_day);
                            const UserSearh = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2;`, [sender_id, recipient_id]);
                            clients.set(sender_id, ws);
                            if (UserSearh.rows.length == 2 && moment(time_stamp, moment.ISO_8601, true).isValid()) {
                                const result = await db.query(
                                    `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp)
                                values ($1, $2, $3, $4, $5) RETURNING id, time_stamp;`,
                                    [chat_id, sender_id, recipient_id, content, time_stamp]
                                );
                                const message_id = result.rows[0].id;
                                const time_of_day = result.rows[0].time_stamp;
                                if (clients.has(recipient_id)) {
                                    const recipient_ws = clients.get(recipient_id);
                                    console.log('work')
                                    recipient_ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day }));
                                }
                                await getNotification(sender_id, recipient_id, content)
                                ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day, type:"new_message" }));
                            }
                            break;
                        case 'update_message':
                            const user_id_update = await db.query(`SELECT id FROM users WHERE login = $1;`, [login])
                            const message_update = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
                            if (user_id_update.rows[0].id == message_update.rows[0].sender_id) {
                                await db.query(
                                    `UPDATE messages
                                SET content = $1
                                WHERE id = $2;`,
                                    [new_content, message_id])
                                ws.send(JSON.stringify({message_id, chat_id, sender_id, recipient_id, new_content, time_of_day, type: "updated_message"}))
                                if (clients.has(recipient_id)) {
                                    const recipient_ws = clients.get(recipient_id);
                                    recipient_ws.send(JSON.stringify({message_id, chat_id, sender_id, recipient_id, new_content, time_of_day, type: "updated_message"}))
                                }
                            }
                            break;
                        case 'archive_message':
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
                                    if (clients.has(recipient_id) && clients.has(sender_id)) {
                                        const recipient_ws = clients.get(recipient_id);
                                        const sender_ws = clients.get(sender_id);
                                        recipient_ws.send(JSON.stringify({message_id, type: "delete_message"}));
                                        sender_ws.send(JSON.stringify({ message_id, type: "delete_message" }))
                                    }
                                }
                            } else { return }
                    }
                } catch (error) {
                    console.error(error);
                }
            })
        } else { return }
    })
}

