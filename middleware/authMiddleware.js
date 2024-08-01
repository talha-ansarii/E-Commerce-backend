const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cookieParser = require('cookie-parser');

exports.authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'You are not logged in' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  const { id } = req.user;

  const query = 'SELECT role FROM users WHERE id = ?';
  const values = [id];
  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0 || results[0].role !== 'admin') return res.status(403).json({ error: 'Access denied, admin only' });
    next();
  });
};
