const mysql = require('mysql');
const dotenv = require("dotenv");
if (process.env.NODE_ENV !== 'PRODUCTION') {
    dotenv.config({path: "backend/config.env"});
} else {
    dotenv.config({path: "backend/config.env"});
}

const isProduction = process.env.NODE_ENV === 'PRODUCTION';

let HOST = process.env.HOST_LOCAL;
let USER = process.env.USER_LOCAL;
let PASSWORD = process.env.PASSWORD_LOCAL;
let DATABASE = process.env.DATABASE_LOCAL;

if (isProduction) {
    HOST = process.env.HOST;
    USER = process.env.USER;
    PASSWORD = process.env.PASSWORD;
    DATABASE = process.env.DATABASE;
}

// MySQL Connection
const db = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = db;