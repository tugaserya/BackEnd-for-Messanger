const WebSocket = require('ws');
const { Server } = WebSocket;
const db = require('../db')
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json")
const { UserChecker } = require("../userChecker");

const MessageCases = require('./messages.cases') 
const ChatCases = require('./chat.cases')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const clients = new Map();

const sendNotification = async (sender_id, recipient_id, content) => {
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
        const params = new URL("wss://domenforallnames.space:4200" + req.url).searchParams;
        const id = params.get("id");
        const login = params.get("login")
        const password = params.get("password");
        clients.set(id, ws);
        if (await UserChecker(login, password)) {
            ws.on('message', async (message) => {
                try {
                    const { type } = JSON.parse(message);
                    const message_data = message
                    let payload
                    switch (type) {
                        case 'new_message':
                            const NewMessage = await MessageCases.NewMessage(message_data)
                            payload = JSON.stringify(NewMessage)
                            if (clients.has(String(NewMessage.recipient_id))) {
                                const recipient_ws = clients.get(String(NewMessage.recipient_id));
                                recipient_ws.send(payload);
                            }
                            await sendNotification(NewMessage.sender_id, NewMessage.recipient_id, NewMessage.content)
                            ws.send(payload);
                            break;
                        case 'update_message':
                            const updated_message = await MessageCases.UpdateMessage(message_data, login)
                            payload = JSON.stringify(updated_message)
                            if (clients.has(String(updated_message.recipient_id))) {
                                const recipient_ws = clients.get(String(updated_message.recipient_id));
                                recipient_ws.send(payload)
                            } ws.send(payload)
                            break;
                        case 'archive_message':
                            const message = await MessageCases.ArchiveMessage(message_data, login)
                            payload = JSON.stringify({ message_id: message.rows[0].id, type: "delete_message" })
                            if (clients.has(String(message.rows[0].recipient_id)) && clients.has(String(message.rows[0].sender_id))) {
                                const recipient_ws = clients.get(String(message.rows[0].recipient_id))
                                const sender_ws = clients.get(String(message.rows[0].sender_id))
                                recipient_ws.send(payload)
                                sender_ws.send(payload)
                            } else if(clients.has(String(message.rows[0].recipient_id))){
                                const recipient_ws = clients.get(String(message.rows[0].recipient_id))
                                recipient_ws.send(payload)
                            } else if (clients.has(String(message.rows[0].sender_id))){
                                const sender_ws = clients.get(String(message.rows[0].sender_id));
                                sender_ws.send(payload)
                            }
                            break;
                        case 'is_readed_message':
                            const readed_meassage = await MessageCases.IsReadedMessage(message_data)
                            payload = JSON.stringify(readed_meassage)
                            if(clients.has(String(readed_meassage.rows[0].recipient_id)) && clients.has(String(readed_meassage.rows[0].sender_id))) {
                                const recipient_ws = clients.get(String(readed_meassage.rows[0].recipient_id))
                                recipient_ws.send(payload)
                                const sender_ws = clients.get(String(readed_meassage.rows[0].sender_id))
                                sender_ws.send(payload)
                            } else if(clients.has(String(readed_meassage.rows[0].recipient_id))){
                                const recipient_ws = clients.get(String(readed_meassage.rows[0].recipient_id))
                                recipient_ws.send(payload)
                            } else if(clients.has(String(readed_meassage.rows[0].sender_id))){
                                const sender_ws = clients.get(String(readed_meassage.rows[0].sender_id))
                                sender_ws.send(payload)
                            }
                        break;
                        case 'archive_chat':
                            const archived_chat = await ChatCases.ArchiveChat(message_data)
                            payload = JSON.stringify({chat_id: archived_chat.rows[0].id, type: "deleted_chat"})
                            if(clients.has(String(archived_chat.rows[0].user_id_1)) && clients.has(String(archived_chat.rows[0].user_id_2))){
                                const user_1_ws = clients.get(String(archived_chat.rows[0].user_id_1))
                                user_1_ws.send(payload)
                                const user_2_ws = clients.get(String(archived_chat.rows[0].user_id_2))
                                user_2_ws.send(payload)
                            } else if(clients.has(String(archived_chat.rows[0].user_id_1))){
                                const user_1_ws = clients.get(String(archived_chat.rows[0].user_id_1))
                                user_1_ws.send(payload)
                            } else if(clients.has(String(archived_chat.rows[0].user_id_2))){
                                const user_2_ws = clients.get(String(archived_chat.rows[0].user_id_2))
                                user_2_ws.send(payload)
                            }
                        break;
                        case 'get_chats':
                            const chats_list = await ChatCases.GetChats(message_data)
                            ws.send(JSON.stringify(chats_list, type))
                        break;
                        case 'update_chat':
                            const updated_chat = await ChatCases.UpdateChat(message_data)
                            ws.send(JSON.stringify(updated_chat))
                        }
                } catch (error) {
                    console.error(error);
                }
            })
        } else { return }
    })
}

