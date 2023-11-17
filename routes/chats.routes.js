const  Router = require('express')
const router = new Router()
const  ChatsController = require('../controller/chats.controller')

router.post('/chat_creating', ChatsController.createChat)
router.post('/get_chats', ChatsController.getChat)

module.exports = router