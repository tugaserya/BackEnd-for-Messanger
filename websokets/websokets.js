const WebSocket = require('ws');
const { Server } = WebSocket;
const db = require('../db')
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json")
const { UserChecker } = require("../userChecker");

const { MessageCases } = require('./messages.cases') 

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
        const login = decodeURIComponent(req.url.split(/login=|&password=/)[1])
        const password = req.url.split(/&password=|&id=/)[1]
        const id = req.url.split('&id=')[1]
        clients.set(id, ws);
        if (await UserChecker(login, password)) {
            ws.on('message', async (message) => {
                try {
                    const { type } = JSON.parse(message);
                    console.log(type+" - type");
                    const message_data = message
                    switch (type) {
                        case 'new_message':
                            const NewMessage = await MessageCases.NewMessage(message_data)
                            if (clients.has(String(recipient_id))) {
                                const recipient_ws = clients.get(String(recipient_id));
                                recipient_ws.send(NewMessage);
                            }
                            await getNotification(sender_id, recipient_id, content)
                            ws.send(NewMessage);
                            break;
                        case 'update_message':
                            const updated_message = await MessageCases.UpdateMessage(message_data, login)
                            if (clients.has(String(message_update.rows[0].recipient_id))) {
                                const recipient_ws = clients.get(String(message_update.rows[0].recipient_id));
                                recipient_ws.send(updated_message)
                            }
                            ws.send(updated_message)
                            break;
                        case 'archive_message':
                            const message = await MessageCases.ArchiveMessage(message_data, login)
                            if (clients.has(String(message.rows[0].recipient_id)) && clients.has(String(message.rows[0].sender_id))) {
                                const recipient_ws = clients.get(String(message.rows[0].recipient_id));
                                const sender_ws = clients.get(String(message.rows[0].sender_id));
                                recipient_ws.send(JSON.stringify({ message_id: deleting_message_id, type: "delete_message" }));
                                sender_ws.send(JSON.stringify({ message_id: deleting_message_id, type: "delete_message" }))}
                            break;
                        case 'is_readed_message':
                        break;
                        case 'archive_chat':
                        break;
                        }
                } catch (error) {
                    console.error(error);
                }
            })
        } else { return }
    })
}

