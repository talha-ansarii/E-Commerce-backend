const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const categoryRoutes = require('../routes/categoryRoutes');
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
app.use('/categories', categoryRoutes);


// Tests for the category routes
describe('Category API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  // Test for GET /categories
  describe('GET /categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }];
      db.query.mockImplementation((query, callback) => {
        callback(null, mockCategories);
      });

      const res = await request(app).get('/categories');

      expect(res.statusCode).toEqual(200);
      expect(res.body.categories).toEqual(mockCategories);
    });

    it('should return 500 if there is a server error', async () => {
      db.query.mockImplementation((query, callback) => {
        callback(new Error('Server error'), null);
      });

      const res = await request(app).get('/categories');

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Server error');
    });
  });


  // Test for GET /categories/:id
  describe('GET /categories/:id', () => {
    it('should return a category by ID', async () => {
      const mockCategory = { id: 1, name: 'Electronics' };
      db.query.mockImplementation((query, values, callback) => {
        callback(null, [mockCategory]);
      });

      const res = await request(app).get('/categories/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.category).toEqual(mockCategory);
    });

    it('should return 404 if the category is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const res = await request(app).get('/categories/1');

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Category not found');
    });
  });


  // Test for POST /categories
  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const mockInsertId = 1;
      const newCategory = { name: 'New Category', description: 'A new category' };

      db.query.mockImplementation((query, values, callback) => {
        callback(null, { insertId: mockInsertId });
      });

      const res = await request(app)
        .post('/categories')
        .send(newCategory);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        id: mockInsertId,
        name: newCategory.name,
        description: newCategory.description
      });
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/categories')
        .send({ name: '', description: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });


  // Test for PUT /categories/:id
  describe('PUT /categories/:id', () => {
    it('should update an existing category', async () => {
      const mockId = 1;
      const updatedCategory = { name: 'Updated Category', description: 'Updated description' };

      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app)
        .put(`/categories/${mockId}`)
        .send(updatedCategory);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        message: 'Category updated',
        id: mockId,
        name: updatedCategory.name,
        description: updatedCategory.description
      });
    });

    it('should return 404 if the category is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 0 });
      });

      const res = await request(app)
        .put('/categories/1')
        .send({ name: 'Non-existent Category' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Category not found');
    });
  });


  // Test for DELETE /categories/:id
  describe('DELETE /categories/:id', () => {
    it('should delete a category by ID', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app).delete('/categories/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Category deleted successfully');
    });

    it('should return 404 if the category is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 0 });
      });

      const res = await request(app).delete('/categories/1');

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Category not found');
    });
  });
});