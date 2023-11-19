const  Router = require('express')
const router = new Router()
const FileUploadsController = require('../controller/file_uploads.controller')

router.post('/avatar_upload', FileUploadsController.AvatarsUpload)

module.exports = router