const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const { Server } = WebSocket;
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json")
const db =require('./db')
const moment = require('moment')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const PORT = process.env.PORT || 4200;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/fullchain.pem')
};


// Запросы для подключения путей URL
const userRouter = require('./routes/user.routes');
const chatRouter = require('./routes/chats.routes');
const messagesRouter = require('./routes/messages.routes');

const app = express();

app.use(express.json()); // Распарсить JSON response
app.use('/', userRouter)
app.use('/', chatRouter)
app.use('/', messagesRouter)

const server = https.createServer(options, app);
// biba()
server.listen(PORT, () => {
  console.log('Сервер слушает на порту', PORT);
});


const wss = new Server({ server });


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

wss.on('connection', (ws) => {
    console.log('Новое соединение установлено');


    ws.on('message', async (message) => {
        try {
        console.log('Получено', JSON.parse(message));

        const { chat_id, sender_id, recipient_id, content, time_of_day } = JSON.parse(message);
        const time_stamp = new Date(time_of_day);
        const UserSearh = await db.query(`SELECT id FROM users WHERE id = $1 OR id = $2`,
        [sender_id, recipient_id])
        if (UserSearh.rows.length == 2 && moment(time_stamp, moment.ISO_8601, true).isValid()){
        clients.set(sender_id, ws);
        
        const result = await db.query(
            `INSERT INTO messages (chat_id, sender_id, recipient_id, content, time_stamp)
             values ($1, $2, $3, $4, $5) RETURNING id time_stamp;`,
            [chat_id, sender_id, recipient_id, content, time_stamp])
            const message_id = result.rows[0].id;
            const time_of_day = result.rows[0].time_stamp;
            console.log(time_of_day)
        if (clients.has(recipient_id)) {
            const recipient_ws = clients.get(recipient_id);
            recipient_ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day }));
            await getNotification(sender_id, recipient_id, content)
        }

        ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day }));
    } else{
        return console.log('Все наебнулось')
    }}catch (err) {
        console.error('ошибка сообщения ', err);
    }});
});

module.exports = server;