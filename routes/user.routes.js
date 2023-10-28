const  Router = require('express')
const router = new Router()
const UserController = require('../controller/user.controller')
//пути URL для вызова функций по запросу
router.post('/registration', UserController.registerUser)
router.post('/login', UserController.loginUser)
router.post('/search',UserController.searchUser)

module.exports = router