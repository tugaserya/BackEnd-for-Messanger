const db = require('../db')
const bcrypt = require('bcrypt')

class UserController {
    async registerUser(req, res) {
        const { user_name, login, password } = req.body
        try {
        const loginChecker = await db.query(`SELECT login FROM users where login = $1`, [login])
        if (loginChecker.rows.length > 0) { // Проверка на существование пользователя
            res.status(409).json({ message: 'This user already exists!' })
        } else {
            const hashedPassword = await bcrypt.hash(password, 10) // Хеширование пароля и вставка в БД
            await db.query(`INSERT INTO users (user_name, login, password, FCMtoken) values ($1, $2, $3, $4)`,
            [user_name, login, hashedPassword,0])
            res.status(200).json({ message: 'User registered successfully!' });
        }}catch (err) {
            console.error('ошибка при регистрации', err);
        }
    }


    async loginUser(req, res) {
        const {login, password, FCMtoken} = req.body;
        try {
            const userData = await db.query('SELECT * FROM users WHERE login = $1', [login]);
            if (userData.rows.length > 0) {//проверка на валидность по логину, а затем паролю
                const validPassword = await bcrypt.compare(password, userData.rows[0].password);
                if (validPassword) {
                    await db.query(`UPDATE users SET FCMtoken = $1 WHERE login = $2;`,[FCMtoken, login])
                    res.status(200).json({
                        "id": userData.rows[0].id,
                        "user_name": userData.rows[0].user_name});
                } else {
                    res.status(401).json({error: 'wrong login or password'});
                }
            } else {
                res.status(401).json({error: 'wrong login or password'});
            }
        } catch (err) {
            console.error('Error validating user data', err);
        }
    }

    async searchUser(req, res) {
        const {user_name} = req.body
        const Usersearcher = await db.query(
            `SELECT * FROM users where user_name LIKE $1`, [
            `%${user_name}%`]
        )
        //поиск пользователя по частичному или полному совпадению его имени(может быть несколько совпадений)
        if (Usersearcher.rows.length > 0){
        const users = Usersearcher.rows.map(user => ({
            "id": user.id,
            "user_name": user.user_name
        }));
        res.status(200).json(users);
    } else {
        res.status(404).json({message:"Users not found!"})
    }
    }
}

module.exports = new UserController()