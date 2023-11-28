const db = require('./db')
const bcrypt = require('bcrypt')

module.exports.UserChecker = async (id, login, password) => {
    const userData = await db.query('SELECT * FROM users WHERE id = $1 AND login = $2', [id, login])
            if (userData.rows.length > 0) {
                const validPassword = await bcrypt.compare(password, userData.rows[0].password)
                if (validPassword) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
}
