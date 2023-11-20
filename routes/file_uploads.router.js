const  Router = require('express')
const router = new Router()
const FileUploadsController = require('../controller/file_uploads.controller')

router.post('/avatar_upload', FileUploadsController.AvatarsUpload)
router.get('/avatar_download/:user_id', FileUploadsController.AvatarDownload)

module.exports = router