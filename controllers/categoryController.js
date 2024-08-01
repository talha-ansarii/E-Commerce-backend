const db = require('../config/db'); // Import database configuration
const { createCategorySchema, updateCategorySchema } = require("../schemas/categorySchema"); // Import validation schemas
const xss = require('xss'); // Import XSS sanitization library

// Utility functions

// Execute a database query and return a promise
const queryDatabase = (query, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) return reject(err); 
      resolve(results); 
    });
  });
};

// Validate and sanitize request body
const validateAndSanitize = (schema, body) => {
  const result = schema.safeParse(body); 
  if (!result.success) {
    const errors = result.error.format(); 
    return { success: false, errors }; 
  }

  // Sanitize body to prevent XSS attacks
  const sanitizedBody = {};
  for (const key in body) {
    sanitizedBody[key] = xss(body[key]);
  }
  return { success: true, sanitizedBody };
};

// Controller functions

// Get all categories
exports.getAllCategories = async (req, res) => {
  const query = 'SELECT * FROM categories'; 
  try {
    const results = await queryDatabase(query);
    res.json({ categories: results }); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a category by ID
exports.getCategoryById = async (req, res) => {
  const { id } = req.params; 
  const query = 'SELECT * FROM categories WHERE id = ?'; 
  const values = [id];

  try {
    const results = await queryDatabase(query, values); 
    if (results.length === 0) return res.status(404).json({ error: 'Category not found' }); 
    res.json({ category: results[0] }); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  const { success, errors, sanitizedBody } = validateAndSanitize(createCategorySchema, req.body);
  if (!success) {
    return res.status(400).json({ error: 'Validation failed', ...errors }); 
  }

  const { name, description } = sanitizedBody; 
  const query = 'INSERT INTO categories (name, description) VALUES (?, ?)'; 
  const values = [name, description];

  try {
    const results = await queryDatabase(query, values); 
    res.status(201).json({ id: results.insertId, name, description }); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an existing category
exports.updateCategory = async (req, res) => {
  const { id } = req.params; 
  const { success, errors, sanitizedBody } = validateAndSanitize(updateCategorySchema, req.body);
  if (!success) {
    return res.status(400).json({ error: 'Validation failed', ...errors }); 
  }

  const { name, description } = sanitizedBody;

  let query = 'UPDATE categories SET '; // Start building the update query
  const values = [];

  if (name) {
    query += 'name = ?, '; // Add name to query if provided
    values.push(name);
  }
  if (description) {
    query += 'description = ?, '; // Add description to query if provided
    values.push(description);
  }

  query = query.slice(0, -2) + ' WHERE id = ?'; // Finalize the query
  values.push(id);

  if (values.length === 1) {
    return res.status(400).json({ error: 'No fields provided for update' }); // Handle case where no fields are provided
  }

  try {
    const results = await queryDatabase(query, values); 
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Category not found' }); 
    res.json({ message: 'Category updated', id: parseInt(id), name, description }); 
  } catch (err) {
    res.status(500).json({ error: err.message }); 
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params; 
  const query = 'DELETE FROM categories WHERE id = ?'; 
  const values = [id];

  try {
    const results = await queryDatabase(query, values); 
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Category not found' }); 
    res.json({ message: 'Category deleted successfully' }); 
  } catch (err) {
    res.status(500).json({ error: err.message }); 
  }
};
