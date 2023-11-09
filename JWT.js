const jwt = require('jsonwebtoken');

module.exports.JWT_checker = async (token) => {
    try {
        jwt.verify(token, 'PxJdEFnXau');
        return true;
    } catch (err) {
        console.log('JWTtoken_chek error ' + err)
        return false
    }
}