const  Router = require('express')
const router = new Router()
const  ChatsController = require('../controller/chats.controller')
//пути URL для вызова функций по запросу
router.post('/chat_creating', ChatsController.createChat)
router.post('/get_chats', ChatsController.getChat)
//router.post('/archive_chat', ChatsController.archiveChat)

module.exports = router