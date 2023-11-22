const  Router = require('express')
const router = new Router()
const FileUploadsController = require('../controller/file_uploads.controller')

router.post('/avatar_upload', FileUploadsController.AvatarsUpload)
router.post('/avatar_download', FileUploadsController.AvatarDownload)
router.post('/avatar_delete', FileUploadsController.DeleteAvatar)
router.post('/file_upload', FileUploadsController.FileUpload)
router.post('file_download', FileUploadsController.FileDownload)

module.exports = router