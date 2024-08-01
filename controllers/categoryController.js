const db = require('../config/db');
const { createCategorySchema, updateCategorySchema} = require("../schemas/categorySchema")
const xss = require('xss');

exports.getAllCategories = async (req, res) => {

    const query = 'SELECT * FROM categories';

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ categories: results });
      });

}


exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM categories WHERE id = ?';
    const values = [id];
    db.query(query, values, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Category not found' });
      res.json({ category: results[0]});
    });
}


exports.createCategory = async (req, res) => {
    const body = req.body;

    const result = createCategorySchema.safeParse(body)
    if(!result.success){
      const errors = result.error.format();
      return res.status(400).json({ error: 'Validation failed', name: errors?.name?._errors || null, description: errors?.description?._errors || null});
    }
    const { name, description } = req.body;
    const sanitized_name = xss(name);
    const sanitized_description = xss(description);


    const query = 'INSERT INTO categories (name,description) VALUES (?,?)';
    const values = [sanitized_name, sanitized_description];
  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: results.insertId, sanitized_name, sanitized_description });
  });
}


exports.updateCategory = async (req, res) => {
    const { id } = req.params;
  const body = req.body;

  const result = updateCategorySchema.safeParse(body)
  if(!result.success){
    const errors = result.error.format();
    return res.status(400).json({ error: 'Validation failed', name: errors?.name?._errors || null, description: errors?.description?._errors || null});
  }
  const { name, description } = req.body;
  const sanitized_name = xss(name);
  const sanitized_description = xss(description);

  // Initialize the base query
  let query = 'UPDATE categories SET ';
  const values = [];

  // Build the query dynamically
  if (sanitized_name) {
    query += 'name = ?, ';
    values.push(sanitized_name);
  }
  if (sanitized_description) {
    query += 'description = ?, ';
    values.push(sanitized_description);
  }

  // Remove the trailing comma and space
  query = query.slice(0, -2);

  // Add the WHERE clause
  query += ' WHERE id = ?';
  values.push(id);

  // Ensure there are fields to update
  if (values.length === 1) { // Only the id is in the values array
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category updated', id: parseInt(id), sanitized_name, sanitized_description });
  });
}


exports.deleteCategory = async(req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM categories WHERE id = ?';
   const values = [id];
  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  });
}


