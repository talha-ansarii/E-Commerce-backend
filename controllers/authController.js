const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const { createUserSchema, loginUserSchema, updateUserSchema } = require("../schemas/userSchema")


exports.register = async (req, res) => {
    const body = req.body;

  const result = createUserSchema.safeParse(body)
  if(!result.success){
    const errors = result.error.format();
    return res.status(400).json({ error: 'Validation failed', username: errors?.username?._errors || null, email: errors?.email?._errors || null, password: errors?.password?._errors || null, role: errors?.role?._errors || null });
  }

    const { username, email, password, role } = req.body;
    const sanitized_username = xss(username);
    const sanitized_email = xss(email);
    const sanitized_password = xss(password);
    const sanitized_role = xss(role);

        const hashedPassword = await bcrypt.hash(sanitized_password, 10);


       
        const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
        const values = [sanitized_username, sanitized_email, hashedPassword, sanitized_role];

        db.query(query, values , (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Account created!" ,  id: results.insertId });
          });
    
};


exports.login = async (req, res) => {
    const body = req.body;


 const result = loginUserSchema.safeParse(body)
  if(!result.success){
    const errors = result.error.format();
    return res.status(400).json({ error: 'Validation failed',  email: errors?.email?._errors || null, password: errors?.password?._errors || null });
  }
    const { email, password } = req.body;
    const sanitized_email = xss(email);
    const sanitized_password = xss(password);


    const query = 'SELECT * FROM users WHERE email = ?';
    const values = [sanitized_email];
  db.query(query, values, async (err, results) => {

    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(sanitized_password, user.password_hash);

    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7h' });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json({ message: 'Logged in successfully' });
  });
};

// Log out a user
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};



exports.getProfile = async (req, res) => {
   
    const id = req.user.id

    const query = 'SELECT id, username, email, created_at, role FROM users WHERE id = ?';
    const values = [id];
    

    db.query(query, values , (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ user: results[0] });
          });
  
};



exports.updateProfile = async (req, res) => {

    const id = req.user.id;

    const body = req.body;

    const result = updateUserSchema.safeParse(body)

    if(!result.success){
      const errors = result.error.format();
      return res.status(400).json({ error: 'Validation failed',  email: errors?.email?._errors || null, password: errors?.password?._errors || null, role: errors?.role?._errors || null, username: errors?.username?._errors || null });
    }

    const { username, email, password, role } = req.body;

    const sanitized_username = xss(username);
    const sanitized_email = xss(email);
    const sanitized_password = xss(password);
    const sanitized_role = xss(role);


    const fields = [];
    const values = [];

    if (sanitized_username) {
      fields.push('username = ?');
      values.push(sanitized_username);
    }
    if (sanitized_email) {
      fields.push('email = ?');
      values.push(sanitized_email);
    }
    if (sanitized_role) {
      fields.push('role = ?');
      values.push(sanitized_role);
    }
    if (sanitized_password) {
      const hashedPassword = await bcrypt.hash(sanitized_password, 10);
      fields.push('password_hash = ?');
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    console.log(query)
    console.log(values)

    db.query(query, values , (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Profile updated successfully' });
    });

   
};