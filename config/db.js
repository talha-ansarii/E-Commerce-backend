const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err){ 
    console.log(err)
    console.log('Error connecting to the database.');
    throw err;
   }else{
     
     console.log('Connected to the database.');
   }
});

module.exports = connection;
