const db = require('../db')
const {UserChecker} = require("../userChecker");
const multer = require('multer')
const path = require('path')
const fs = require('fs')


class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
            let storage = multer.diskStorage({
                destination(req, file, cb) {
                    const uploadPath = path.join(__dirname, '../../uploads/avatars/');
                    cb(null, uploadPath);
                },
                async filename (req, file, cb) {
                    const Avatar = await db.query(`SELECT * FROM users WHERE id = $1;`, [req.body.id])
                    if(Avatar.rows[0].avatar == 0){
                        await db.query(`UPDATE users SET avatar = $1 WHERE id = $2;`,[`${req.body.id}_${req.body.login}_${file.originalname}`, req.body.id])
                        cb(null, `${req.body.id}_${req.body.login}_${file.originalname}`);
                    }else {
                        await db.query(`UPDATE users SET avatar = $1 WHERE id = $2;`,[`${req.body.id}_${req.body.login}_${file.originalname}`, req.body.id])
                        fs.unlink(path.join(__dirname, '../../uploads/avatars/' + Avatar.rows[0].avatar), (err) => {
                            if(err){console.error(err);}
                        })
                        cb(null, `${req.body.id}_${req.body.login}_${file.originalname}`);
                    }
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
                    } else{ cb(null, false) }
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

    async AvatarDownload(req, res){
        try{
            const user = await db.query(`SELECT * FROM users WHERE id = $1;`, [req.params.user_id])
            res.sendFile(path.join(__dirname, '../../uploads/avatars/' + user.rows[0].avatar))
        } catch(err){
            console.error(err);
            res.status(500).json({message: "Ошибка при отправке файла"})
        }
    }
}

module.exports = new FileUploadsController()
