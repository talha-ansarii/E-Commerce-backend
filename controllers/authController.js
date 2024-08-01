const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const { createUserSchema, loginUserSchema, updateUserSchema } = require("../schemas/userSchema");

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const validateAndSanitize = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.format();
    return { success: false, errors };
  }

  const sanitizedBody = {};
  for (const key in body) {
    sanitizedBody[key] = xss(body[key]);
  }
  return { success: true, sanitizedBody };
};

const queryDatabase = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.register = async (req, res) => {
  const { success, errors, sanitizedBody } = validateAndSanitize(createUserSchema, req.body);
  if (!success) {
    return res.status(400).json({ error: 'Validation failed', ...errors });
  }

  const { username, email, password, role } = sanitizedBody;
  const hashedPassword = await hashPassword(password);
  const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
  const values = [username, email, hashedPassword, role];

  try {
    const results = await queryDatabase(query, values);
    res.status(201).json({ message: "Account created!", id: results.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { success, errors, sanitizedBody } = validateAndSanitize(loginUserSchema, req.body);
  if (!success) {
    return res.status(400).json({ error: 'Validation failed', ...errors });
  }

  const { email, password } = sanitizedBody;
  const query = 'SELECT * FROM users WHERE email = ?';
  const values = [email];

  try {
    const results = await queryDatabase(query, values);
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json({ message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
  const id = req.user.id;
  const query = 'SELECT id, username, email, created_at, role FROM users WHERE id = ?';
  const values = [id];

  try {
    const results = await queryDatabase(query, values);
    res.status(200).json({ user: results[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { success, errors, sanitizedBody } = validateAndSanitize(updateUserSchema, req.body);
  if (!success) {
    return res.status(400).json({ error: 'Validation failed', ...errors });
  }

  const id = req.user.id;
  const { username, email, password, role } = sanitizedBody;
  const fields = [];
  const values = [];

  if (username) {
    fields.push('username = ?');
    values.push(username);
  }
  if (email) {
    fields.push('email = ?');
    values.push(email);
  }
  if (role) {
    fields.push('role = ?');
    values.push(role);
  }
  if (password) {
    const hashedPassword = await hashPassword(password);
    fields.push('password_hash = ?');
    values.push(hashedPassword);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  try {
    await queryDatabase(query, values);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
