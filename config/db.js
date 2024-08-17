const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "sql.freedb.tech",
  user: process.env.DB_USER || "freedb_user-talha",
  password: process.env.DB_PASS || "UYmSg54w%2CX%wn",
  database: process.env.DB_NAME || "freedb_ecommerce-app",
  port: process.env.DB_PORT || 3306
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
