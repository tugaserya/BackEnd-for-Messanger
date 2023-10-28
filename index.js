const express = require('express');
const https = require('https');
const fs = require('fs');
const biba = require('./websokets.js');

const PORT = process.env.PORT || 4200;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/domenforallnames.space/fullchain.pem')
};


// Запросы для подключения путей URL
const userRouter = require('./routes/user.routes');
const chatRouter = require('./routes/chats.routes');
const messagesRouter = require('./routes/messages.routes');
const { Model } = require('firebase-admin/lib/machine-learning/machine-learning.js');

app.use(express.json()); // Распарсить JSON response
app.use('/', userRouter)
app.use('/', chatRouter)
app.use('/', messagesRouter)

const server = https.createServer(options, app);
biba()
server.listen(PORT, () => {
  console.log('Сервер слушает на порту', PORT);
});

module.exports = server;