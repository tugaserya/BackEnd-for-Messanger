const  Router = require('express')
const router = new Router()
const FileUploadsController = require('../controller/file_uploads.controller')

router.post('/avatar_upload', FileUploadsController.AvatarsUpload)
router.post('/avatar_download', FileUploadsController.AvatarDownload)
router.post('/avatar_delete', FileUploadsController.DeleteAvatar)

module.exports = router