const express = require('express');
const https = require('https');
const fs = require('fs');
const wsModule = require('./websokets/websokets')


const PORT = process.env.PORT || 4200;
const testPORT = 2228;
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/fullchain.pem')
};




const userRouter = require('./routes/user.routes');
const chatRouter = require('./routes/chats.routes');
const messagesRouter = require('./routes/messages.routes');
const file_uploadsRouter = require('./routes/file_uploads.router')

const app = express();

app.use(express.json());
app.use('/', userRouter)
app.use('/', chatRouter)
app.use('/', messagesRouter)
app.use('/', file_uploadsRouter)


const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log('Сервер слушает на порту', PORT);
});

wsModule.initWebSocket(server);
