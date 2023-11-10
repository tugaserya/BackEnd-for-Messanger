const db = require('./db')
const bcrypt = require('bcrypt')

export const UserChecker = async (login, password) => {
    const userData = await db.query('SELECT * FROM users WHERE login = $1', [login]);
            if (userData.rows.length > 0) {
                const validPassword = await bcrypt.compare(password, userData.rows[0].password);
                if (validPassword) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
}
