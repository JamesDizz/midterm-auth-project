const mysql = require('mysql2/promise');


const pool = mysql.createPool({
    host: '127.0.0.1', // or 'localhost'
    user: 'root',      // default XAMPP user is 'root'
    password: '',      // default XAMPP password is empty
    database: 'midterm_auth', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Connection Pool Created Successfully");

module.exports = pool;