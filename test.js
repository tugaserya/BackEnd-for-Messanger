const express = require('express');
const https = require('https');
const fs = require('fs');
const ws = require('./websokets')
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
const testPORT = 2228;
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/fullchain.pem')
};


// Запросы для подключения путей URL
const userRouter = require('./routes/user.routes');
const chatRouter = require('./routes/chats.routes');
const messagesRouter = require('./routes/messages.routes');

const app = express();

app.use(express.json()); 
app.use('/', userRouter)
app.use('/', chatRouter)
app.use('/', messagesRouter)


const server = https.createServer(options, app);

server.listen(testPORT, () => {
  console.log('Сервер слушает на порту', testPORT);
});

wsModule.initWebSocket(server);