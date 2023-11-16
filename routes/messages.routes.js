const  Router = require('express')
const router = new Router()
const messageController = require('../controller/message.controller')

//пути URL для вызова функций по запросу
router.post('/get_past_messages', messageController.getPastMessages)

module.exports = router