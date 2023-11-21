const db = require('../db')
const {UserChecker} = require("../userChecker");


class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
           const { file, user_id, login,  password } = req.body
            if(await  UserChecker(login, password)){
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
            if(await UserChecker(req.body.login, req.body.password)){
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
}

module.exports = new FileUploadsController()
