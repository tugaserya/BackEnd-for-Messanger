const Pool = require('pg').Pool
const pool = new Pool({
user: "maximcemencov",
password: "100205",
host: "localhost",
port: 5432,
database: "messenger_test"

})

module.exports = pool