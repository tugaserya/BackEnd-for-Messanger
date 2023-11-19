class FileUploadsController {

    async AvatarsUpload (req, res){
        try{
            let storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, '../uploads/avatars')
                },
                filename: function (req, file, cb) {
                    let newFileName = `${req.body.id}_${req.body.login}` + path.extname(file.originalname);
                    cb(null, newFileName);
                }
            });
            
            let upload = multer({
                storage: storage,
                limits: {
                    fileSize: 10485760
                },
                fileFilter: function (req, file, cb) {
                    if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
                        return cb(new Error('Неверный тип файла'));
                    }
                    cb(null, true);
                }
            }).single('file');
            
            
            upload(req, res, async function (err) {
                if (err) {
                    console.log('not work');
                    res.status(500).json({message: "Ошибка загрузки файла"})
                } else {
                    const { login, password } = req.body
                    if(UserChecker(login, password)){
                        console.log('work');
                        res.status(200).json({message: "Файл загружен"})
                    } else { 
                        console.log('work'); 
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
