const  Router = require('express')
const router = new Router()
const messageController = require('../controller/message.controller')

router.post('/get_past_messages', messageController.getPastMessages)

module.exports = router