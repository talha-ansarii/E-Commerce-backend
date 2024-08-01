const db = require("../config/db");
const xss = require("xss");
const {
  createProductSchema,
  updateProductSchema,
} = require("../schemas/productSchema");

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

// Get all products
exports.getAllProducts = async (req, res) => {
  const query = "SELECT * FROM products";

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ products: results });
  });
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM products WHERE id = ?";
  const value = [id];

  try {
    const results = await queryDatabase(query, value);
    if (results.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json({ product: results[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const body = req.body;
  const { success, errors, sanitizedBody } = validateAndSanitize(
    createProductSchema,
    body
  );
  if (!success) {
    return res.status(400).json({ error: "Validation failed", ...errors });
  }

  const { name, description, price, stock, categoryName } = sanitizedBody;

  // Get category ID based on category name
  const searchQuery = "SELECT id FROM categories WHERE name LIKE ?";
  const searchValue = [`%${categoryName}%`];

  try {
    const categoryResults = await queryDatabase(searchQuery, searchValue);
    if (categoryResults.length === 0)
      return res.status(404).json({ error: "Category not found" });

    const category_id = categoryResults[0].id;

    const insertQuery =
      "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)";
    const insertValues = [name, description, price, stock, category_id];
    const productResults = await queryDatabase(insertQuery, insertValues);

    res
      .status(201)
      .json({ message: "Product created!", id: productResults.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const { success, errors, sanitizedBody } = validateAndSanitize(
    updateProductSchema,
    body
  );
  if (!success) {
    return res.status(400).json({ error: "Validation failed", ...errors });
  }

  const { name, description, price, stock } = sanitizedBody;
  let query = "UPDATE products SET "; // Start building the update query
  const fields = [];
  const values = [];

  // Add fields to update based on provided data
  if (name) {
    fields.push("name = ?");
    values.push(name);
  }
  if (description) {
    fields.push("description = ?");
    values.push(description);
  }
  if (price) {
    fields.push("price = ?");
    values.push(price);
  }
  if (stock) {
    fields.push("stock = ?");
    values.push(stock);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" }); // Handle case where no fields are provided
  }

  query += fields.join(", ") + " WHERE id = ?"; // Finalize the update query
  values.push(id);

  try {
    const results = await queryDatabase(query, values);
    if (results.affectedRows === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json({
      message: "Product updated",
      id,
      name,
      description,
      price: parseInt(price),
      stock: parseInt(stock),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM products WHERE id = ?";
  const values = [id];

  try {
    const results = await queryDatabase(query, values);
    if (results.affectedRows === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
