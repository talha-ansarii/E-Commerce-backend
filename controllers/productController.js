const db = require('../config/db');

const xss = require('xss');
const { createProductSchema, updateProductSchema } = require("../schemas/productSchema")


exports.getAllProducts = (req, res) => {

        const query = 'SELECT * FROM products';

        db.query(query, (err, results) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ products: results });
        });
        
    
};

exports.getProductById = (req, res) => {

  const { id } = req.params;

 
    const query = 'SELECT * FROM products WHERE id = ?';
    const value = [id];

      db.query(query, value, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ product: results[0] });
      });
};

exports.createProduct =  (req, res ) => {
  const body = req.body;
  const result = createProductSchema.safeParse(body)
  if(!result.success){
    const errors = result.error.format();
    return res.status(400).json({ error: 'Validation failed', name: errors?.name?._errors || null, description: errors?.description?._errors || null, price: errors?.price?._errors || null, stock: errors?.stock?._errors || null,categoryName: errors?.categoryName?._errors || null });
  }

  const { name, description, price, stock, categoryName } = req.body;
  const sanitized_name = xss(name);
  const sanitized_description = xss(description);
  const sanitized_price = xss(price);
  const sanitized_stock = xss(stock);
  const sanitized_categoryName = xss(categoryName);




    const searchQuery = 'SELECT id FROM categories WHERE name LIKE ?'
    const searchValue = [`%${sanitized_categoryName}%`]

    //Searching for the category id using the category name provided
    db.query(searchQuery, searchValue, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Category not found' });
      const category_id = results[0].id;
     
    //Inserting the product into the database using the category id found
      const query = 'INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)';
      const value = [sanitized_name, sanitized_description, sanitized_price, sanitized_stock, category_id];
        db.query(query, value, (err, results) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ 
            message: "Product created!",
             id: results.insertId });
        });
    });

  

};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const result = updateProductSchema.safeParse(body)
    if(!result.success){
      const errors = result.error.format();
      return res.status(400).json({ error: 'Validation failed', name: errors?.name?._errors || null, description: errors?.description?._errors || null, price: errors?.price?._errors || null, stock: errors?.stock?._errors || null });
    }

    const { name, description, price, stock } = req.body;
    const sanitized_name = xss(name);
    const sanitized_description = xss(description);
    const sanitized_price = xss(price);
    const sanitized_stock = xss(stock);

  
    // Build the query dynamically based on the fields provided
    let query = 'UPDATE products SET ';
    const fields = [];
    const values = [];
  
    if (sanitized_name) {
      fields.push('name = ?');
      values.push(sanitized_name);
    }
    if (sanitized_description) {
      fields.push('description = ?');
      values.push(sanitized_description);
    }
    if (sanitized_price) {
      fields.push('price = ?');
      values.push(sanitized_price);
    }
    if (sanitized_stock) {
      fields.push('stock = ?');
      values.push(sanitized_stock);
    }
  
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }
  
    query += fields.join(', ') + ' WHERE id = ?';
    values.push(id);
  
    db.query(query, values, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product updated', id, name:sanitized_name, description:sanitized_description, price:sanitized_price, stock:sanitized_stock });
    });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM products WHERE id = ?';
  const values = [id];
  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  });
};
