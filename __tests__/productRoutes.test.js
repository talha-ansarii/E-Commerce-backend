const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('../routes/productRoutes');
const db = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Mocking middleware
jest.mock('../middleware/authMiddleware', () => ({
    authenticate: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next())
  }));


  // Mocking the database
jest.mock('../config/db', () => ({
    query: jest.fn()
  }));

  const app = express();
app.use(bodyParser.json());
app.use('/products', productRoutes);


describe('Prodycts API Endpoints', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    // Test for GET /products
    describe('GET /products', () => {
      it('should return all products', async () => {
        const mockProducts = [{ id: 1, name: 'Laptop' }, { id: 2, name: 'Smartphone' }];
        db.query.mockImplementation((query, callback) => {
          callback(null, mockProducts);
        });
  
        const res = await request(app).get('/products');
  
        expect(res.statusCode).toEqual(200);
        expect(res.body.products).toEqual(mockProducts);
      });
  
      it('should return 500 if there is a server error', async () => {
        db.query.mockImplementation((query, callback) => {
          callback(new Error('Server error'), null);
        });
  
        const res = await request(app).get('/products');
  
        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toBe('Server error');
      });
    });

// Test for GET /products/:id 
  describe('GET /products/:id', () => {
    it('should return a product by ID', async () => {
      const mockProduct = { id: 1, name: 'Laptop' };
      db.query.mockImplementation((query, values, callback) => {
        callback(null, [mockProduct]);
      });

      const res = await request(app).get('/products/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.product).toEqual(mockProduct);
    });

    it('should return 404 if the product is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const res = await request(app).get('/products/1');

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Product not found');
    });
  });

// Test for POST /products
  describe('POST /products', () => {
    it('should create a new product', async () => {
      const mockCategory = [{ id: 1 }];
      const mockInsertId = 1;
      const newProduct = {
        name: 'New Product',
        description: 'A new product',
        price: 99.99,
        stock: 10,
        categoryName: 'Electronics'
      };

      db.query
        .mockImplementationOnce((query, values, callback) => {
          callback(null, mockCategory); // Mock category search result
        })
        .mockImplementationOnce((query, values, callback) => {
          callback(null, { insertId: mockInsertId }); // Mock product insertion result
        });

      const res = await request(app)
        .post('/products')
        .send(newProduct);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        message: 'Product created!',
        id: mockInsertId
      });
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/products')
        .send({ name: '', description: '', price: '', stock: '', categoryName: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 404 if the category is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const res = await request(app)
        .post('/products')
        .send({
          name: 'Product with invalid category',
          description: 'A new product',
          price: 99.99,
          stock: 10,
          categoryName: 'Invalid Category'
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Category not found');
    });
  });

// Test for PUT /products/:id
  describe('PUT /products/:id', () => {
    it('should update an existing product', async () => {
      const mockId = "1"; 
      const updatedProduct = {
        name: 'Updated Product',
        description: 'Updated description',
        price: 199,
        stock: 20
      };

      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app)
        .put(`/products/${mockId}`)
        .send(updatedProduct);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        message: 'Product updated',
        id: mockId,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        stock: updatedProduct.stock
      });
    });

    it('should return 404 if the product is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 0 });
      });

      const res = await request(app)
        .put('/products/1')
        .send({ name: 'Non-existent Product' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 400 if no fields are provided for update', async () => {
      const res = await request(app)
        .put('/products/1')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('No fields provided for update');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product by ID', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app).delete('/products/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Product deleted');
    });

    it('should return 404 if the product is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 0 });
      });

      const res = await request(app).delete('/products/1');

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Product not found');
    });
  });
  
  });