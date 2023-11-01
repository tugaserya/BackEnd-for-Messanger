const express = require('express');
const https = require('https');
const fs = require('fs');
const wsModule = require('./websocket')


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

app.use(express.json()); // Распарсить JSON response
app.use('/', userRouter)
app.use('/', chatRouter)
app.use('/', messagesRouter)
// const webs = ws()
// webs()
//
const server = https.createServer(options, app);

server.listen(test, () => {
  console.log('Сервер слушает на порту', testPORT);
});

wsModule.initWebSocket(server);
