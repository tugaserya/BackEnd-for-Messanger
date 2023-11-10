const db = require('./db')
const bcrypt = require('bcrypt')

module.exports.UserChecker = async (login, password) => {
    const userData = await db.query('SELECT * FROM users WHERE login = $1', [login])
    console.log("work 1");
            if (userData.rows.length > 0) {
                const validPassword = await bcrypt.compare(password, userData.rows[0].password);
                if (validPassword) {
                    console.log("work 2");
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
}
