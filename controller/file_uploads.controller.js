const db = require('../db')
const {UserChecker} = require("../userChecker");
const multer = require('multer')
const path = require('path')


class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
            let storage = multer.diskStorage({
                destination(req, file, cb) {
                    const uploadPath = path.join(__dirname, '../../uploads/avatars');
                    cb(null, uploadPath);
                },
                filename(req, file, cb) {
                    cb(null, `${req.body.login}_${file.originalname}`);
                }
            });
            
            let upload = multer({
                storage,
                limits: {
                    fileSize: 10485760
                },
                fileFilter: function (req, file, cb) {
                    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
                    cb(null, true);
                    } else{ cb(null, false)}
                }
            }).single('image');
            
            
            upload(req, res, async function (err) {
                if (err) {
                    console.log(err);
                    res.status(500).json({message: "Ошибка загрузки файла"})
                } else {
                    const { login, password } = req.body
                    if(UserChecker(login, password)){
                        console.log('work');
                        res.status(200).json({message: "Файл загружен"})
                    } else { 
                        console.log('work_not'); 
                        res.status(418).json({message: "ВОН АЛКАШ"})
                    }
                }
            });
        } catch(err){
                console.error(err);
        }
    }   

}

module.exports = new FileUploadsController()
