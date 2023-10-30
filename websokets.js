const WebSocket = require('ws');
const { Server } = WebSocket;
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json")
const db =require('./db')
const moment = require('moment')
const index = require('./index')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const wss = index


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


const biba = () =>{
    wss.on('connection', (ws) => {
    
    ws.on('message', async (message) => {
      try {
        const { chat_id, sender_id, recipient_id, content, time_of_day } = JSON.parse(message);
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
                recipient_ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day }));
            }
        await getNotification(sender_id, recipient_id, content)
        ws.send(JSON.stringify({ message_id, chat_id, sender_id, recipient_id, content, time_of_day }));
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
}



module.exports = biba;