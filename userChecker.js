const db = require('./db')
const bcrypt = require('bcrypt')

module.exports.UserChecker = async (login, password) => {
    const userData = await db.query('SELECT * FROM users WHERE login = $1', [login])
    console.log("work 1");
            if (userData.rows.length > 0) {
                console.log("work 2");
                const validPassword = await bcrypt.compare(password, userData.rows[0].password)
                console.log("work 3 " + validPassword)
                if (validPassword) {
                    console.log("work 4");
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
}
