const  Router = require('express')
const router = new Router()
const UserController = require('../controller/user.controller')

router.post('/registration', UserController.registerUser)
router.post('/login', UserController.loginUser)
router.post('/search',UserController.searchUser)
router.post('/logout', UserController.LogOutUser)

module.exports = router