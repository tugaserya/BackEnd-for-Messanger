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
                    const message_data = message
                    switch (type) {
                        case 'new_message':
                            const NewMessage = await MessageCases.NewMessage(message_data)
                            if (clients.has(String(NewMessage.recipient_id))) {
                                const recipient_ws = clients.get(String(NewMessage.recipient_id));
                                recipient_ws.send(JSON.stringify(NewMessage));
                            }
                            await getNotification(NewMessage.sender_id, NewMessage.recipient_id, NewMessage.content)
                            ws.send(JSON.stringify(NewMessage));
                            break;
                        case 'update_message':
                            const updated_message = await MessageCases.UpdateMessage(message_data, login)
                            if (clients.has(String(updated_message.recipient_id))) {
                                const recipient_ws = clients.get(String(updated_message.recipient_id));
                                recipient_ws.send(JSON.stringify(updated_message))
                            }
                            ws.send(JSON.stringify(updated_message))
                            break;
                        case 'archive_message':
                            const message = await MessageCases.ArchiveMessage(message_data, login)
                            if (clients.has(String(message.rows[0].recipient_id)) && clients.has(String(message.rows[0].sender_id))) {
                                const recipient_ws = clients.get(String(message.rows[0].recipient_id))
                                const sender_ws = clients.get(String(message.rows[0].sender_id))
                                recipient_ws.send(JSON.stringify({ message_id: message.rows[0].id, type: "delete_message" }))
                                sender_ws.send(JSON.stringify({ message_id: message.rows[0].id, type: "delete_message" }))
                            } else if(clients.has(String(message.rows[0].recipient_id))){
                                const recipient_ws = clients.get(String(message.rows[0].recipient_id))
                                recipient_ws.send(JSON.stringify({ message_id: message.rows[0].id, type: "delete_message" }))
                            } else if (clients.has(String(message.rows[0].sender_id))){
                                const sender_ws = clients.get(String(message.rows[0].sender_id));
                                sender_ws.send(JSON.stringify({ message_id: message.rows[0].id, type: "delete_message" }))
                            }
                            break;
                        case 'is_readed_message':
                            const readed_meassage = await MessageCases.IsReadedMessage(message_data)
                            if(clients.has(String(readed_meassage.rows[0].recipient_id)) && clients.has(String(readed_meassage.rows[0].sender_id))) {
                                const recipient_ws = clients.get(String(readed_meassage.rows[0].recipient_id))
                                recipient_ws.send(JSON.stringify({message_id: readed_meassage.rows[0].id, is_readed: readed_meassage.rows[0].is_readed, type: "readed_message"}))
                                const sender_ws = clients.get(String(readed_meassage.rows[0].sender_id))
                                sender_ws.send(JSON.stringify({message_id: readed_meassage.rows[0].id, is_readed: readed_meassage.rows[0].is_readed, type: "readed_message"}))
                            } else if(clients.has(String(readed_meassage.rows[0].recipient_id))){
                                const recipient_ws = clients.get(String(readed_meassage.rows[0].recipient_id))
                                recipient_ws.send(JSON.stringify({message_id: readed_meassage.rows[0].id, is_readed: readed_meassage.rows[0].is_readed, type: "readed_message"}))
                            } else if(clients.has(String(readed_meassage.rows[0].sender_id))){
                                const sender_ws = clients.get(String(readed_meassage.rows[0].sender_id))
                                sender_ws.send(JSON.stringify({message_id: readed_meassage.rows[0].id, is_readed: readed_meassage.rows[0].is_readed, type: "readed_message"}))
                            }
                        break;
                        case 'archive_chat':
                            const archived_chat = await ChatCases.ArchiveChat(message_data)
                            if(clients.has(String(archived_chat.rows[0].user_id_1)) && clients.has(String(archived_chat.rows[0].user_id_2))){
                                const user_1_ws = clients.get(String(archived_chat.rows[0].user_id_1))
                                user_1_ws.send(JSON.stringify({chat_id: archived_chat.rows[0].id, type: "deleted_chat"}))
                                const user_2_ws = clients.get(String(archived_chat.rows[0].user_id_2))
                                user_2_ws.send(JSON.stringify({chat_id: archived_chat.rows[0].id, type: "deleted_chat"}))
                            } else if(clients.has(String(archived_chat.rows[0].user_id_1))){
                                const user_1_ws = clients.get(String(archived_chat.rows[0].user_id_1))
                                user_1_ws.send(JSON.stringify({chat_id: archived_chat.rows[0].id, type: "deleted_chat"}))
                            } else if(clients.has(String(archived_chat.rows[0].user_id_2))){
                                const user_2_ws = clients.get(String(archived_chat.rows[0].user_id_2))
                                user_2_ws.send(JSON.stringify({chat_id: archived_chat.rows[0].id, type: "deleted_chat"}))
                            }
                        break;
                        case 'get_chats':
                            const chats_list = await ChatCases.GetChats(message_data)
                            ws.send(JSON.stringify(chats_list))
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

