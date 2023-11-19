const db = require('../db')
const {UserChecker} = require("../userChecker");
const multer  = require('multer');



class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
            const params = new URL(req.url).searchParams
            const login = params.get("login")
            const password = params.get("password");
            if(UserChecker(login, password)){
                const user = await db.query(`SELECT * FROM users WHERE login = $1;`,[login])
                let upload = multer({
                    dest: '../uploads/avatars',
                    limits: {
                        fileSize: 10485760
                    },
                    fileFilter: function (req, file, cb) {
                        if (file.mimetype !== 'image/jpeg' || file.mimetype !== 'image/png') {
                            return cb(new Error('Неверный тип файла'));
                        }
                        cb(null, true);
                    },
                    filename: function (req, file, cb) {
                        let newFileName = `${user.rows[0].id}_${user.rows[0].login}` + path.extname(file.originalname);
                        cb(null, newFileName);
                    }
                }).single('file');
                
                upload(req, res, function (err) {
                    if (err) {
                        console.log('not work');
                        res.status(500).json({message: "Ошибка загрузкифайла"})
                    } else {
                        console.log('work');
                        res.status(200).json({message: "Файл загружен"})
                    }
                });
            } else { console.log('work'); res.status(418).json({message: "ВОН АЛКАШ"})}
        } catch(err){
                
        }
    }   

}

module.exports = new FileUploadsController()