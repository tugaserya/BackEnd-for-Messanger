const  Router = require('express')
const router = new Router()
const  ChatsController = require('../controller/chats.controller')

router.post('/chat_creating', ChatsController.createChat)

module.exports = router