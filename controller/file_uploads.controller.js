const db = require('../db')
const {UserChecker} = require("../userChecker");
const multer = require("multer");
const fs = require("fs");
const path = require("path");


class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
           const { file, user_id, login,  password } = req.body
            if(await  UserChecker(user_id, login, password)){
                await db.query(`UPDATE users SET avatar = $1 WHERE id = $2;`, [file , user_id])
                res.status(200).json({message: "Аватар загружен"})
            } else {
                res.status(500).json({message: "Неверный пользователь"})
            }
        } catch(err){
                console.error("ошибка при загрузке файла " + err);
        }
    }   

    async AvatarDownload(req, res){
        try{
            const user = await db.query(`SELECT * FROM users WHERE id = $1;`, [req.body.user_id])
            if(user.rows[0].avatar == 0 ){
                res.status(404).json({message: "у этого пользователя нет аватара"})
            } else{
                const avatar = user.rows[0].avatar
                res.status(200).json({avatar: avatar})
            }
        } catch(err){
            console.error("ошибка отправки файла " + err);
            res.status(500).json({message: "Ошибка при отправке файла"})
        }
    }

    async DeleteAvatar(req, res){
        try{
            if(await UserChecker(req.body.id ,req.body.login, req.body.password)){
                const user = await db.query(`SELECT * FROM users WHERE id = $1;`, [req.body.user_id])
                if(user.rows[0].avatar == 0 ){
                    res.status(404).json({message: "У вас нет аватара"})
                } else{
                await db.query(`UPDATE users SET avatar = $1 WHERE id = $2;`,[0, req.body.user_id])
                res.status(200).json({message:"Автар удален"})
                }
            }
        } catch(err){
            console.error(err);        }
    }

    async FileUpload(req, res){
        try{
            let fileoriginalname;
            let newfilename
            let storage = multer.diskStorage({
                destination(req, file, cb) {
                    let uploadPath;
                    console.log(req.body.filetype + " " + req.body.filetype, req.body.message_id)
                    switch (req.body.filetype) {
                        case 'image':
                            uploadPath = path.join(__dirname, '../../uploads/image/');
                            break
                        case 'media':
                            uploadPath = path.join(__dirname, '../../uploads/media/');
                            break
                        case 'docs':
                            uploadPath = path.join(__dirname, '../../uploads/docs/');
                            break
                        case 'other':
                            uploadPath = path.join(__dirname, '../../uploads/other/');
                            break
                    }
                    cb(null, uploadPath);
                },
                async filename (req, file, cb) {
                    if(!(await UserChecker(req.body.user_id, req.body.login, req.body.password))){
                        res.status(500).json({message: "Неверный пользователь"})
                        return
                    }
                    fileoriginalname = file.originalname
                    newfilename = `${Date.now()}_${file.originalname}`
                    await db.query(`UPDATE messages SET file = $1, file_type = $2 WHERE id = $3;`,[newfilename, req.body.filetype, req.body.message_id])
                    cb(null, String(newfilename));
                }
            });

            let upload = multer({
                storage,
                limits: {
                    fileSize: 90971520
                },
                fileFilter: function (req, file, cb) {cb(null, true);}
            }).single('file');

            upload(req, res, async function (err) {
                if (err) {
                    console.log(err);
                    res.status(500).json({message: "Ошибка загрузки файла"})
                } else {
                        res.status(200).json({filename: fileoriginalname, newfilename: newfilename})
                }
            });
        } catch (err){
            console.error(err)
        }
    }

    async FileDownload(req, res){
        try {
            const {message_id, user_id, login, password} = req.body
            if(await UserChecker(user_id, login, password)){
                const message = await db.query(`SELECT * FROM messages WHERE id = $1;`, [message_id])
                if(message.rows[0].sender_id === user_id || message.rows[0].recipient_id === user_id) {
                    res.sendFile(path.join(__dirname, '../../uploads/' + message.rows[0].file_type + '/' + message.rows[0].file))
                } else{
                    res.status(418).json({message: "id пользователя не найден ВОН АЛКАШ"})
                }
            }else {
                res.status(418).json({message: "ВОН АЛКАШ"})
            }
        }catch (err){
            console.error(err)
        }
    }
}

module.exports = new FileUploadsController()
