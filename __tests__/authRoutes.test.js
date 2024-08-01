const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../routes/authRoutes');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock the authenticate middleware
jest.mock('../middleware/authMiddleware', () => ({
    authenticate: (req, res, next) => {
      req.user = { id: 1, username: 'testuser', role: 'user' }; // Mock user data
      next();
    },
    isAdmin: (req, res, next) => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied, admin only' });
      }
      next();
    }
  }));


// Mocking the database, bcrypt, and jwt
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const app = express();
app.use(bodyParser.json());
app.use('/auth', authRoutes);

describe('User API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const mockInsertId = 1;
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      bcrypt.hash.mockResolvedValue('hashedPassword');

      db.query.mockImplementation((query, values, callback) => {
        callback(null, { insertId: mockInsertId });
      });

      const res = await request(app)
        .post('/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({ message: 'Account created!', id: mockInsertId });
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: '', email: '', password: '', role: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should log in a user with valid credentials', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedPassword' };
      const mockToken = 'fakeToken';

      db.query.mockImplementation((query, values, callback) => {
        callback(null, [mockUser]);
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Logged in successfully');
    });

    it('should return 404 if the user is not found', async () => {
      db.query.mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'notfound@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 if the password is invalid', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedPassword' };

      db.query.mockImplementation((query, values, callback) => {
        callback(null, [mockUser]);
      });

      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Invalid password');
    });
  });

  describe('POST /auth/logout', () => {
    it('should log out a user', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });


  describe('GET /auth/profile', () => {
    it('should return the user profile', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2021-01-01', role: 'user' };

      db.query.mockImplementation((query, values, callback) => {
        callback(null, [mockUser]); // Simulate successful query
      });

      const res = await request(app)
        .get('/auth/profile')
        .set('Cookie', 'token=valid_token'); // Simulate cookie being sent in the request

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(mockUser);
    });
  });


  describe('PUT /auth/profile', () => {
    it('should update the user profile', async () => {
      const updatedUser = { username: 'updatedUser', email: 'updated@example.com' };

      db.query.mockImplementation((query, values, callback) => {
        if (query.startsWith('UPDATE')) {
          callback(null, { affectedRows: 1 }); // Simulate successful update
        } else {
          callback(null, [{ id: 1, ...updatedUser }]); // Simulate successful fetch after update
        }
      });

      const res = await request(app)
        .put('/auth/profile')
        .send(updatedUser)
        .set('Cookie', 'token=valid_token'); // Simulate cookie being sent in the request

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Profile updated successfully');
    });

    it('should return 400 if no fields are provided for update', async () => {
      const res = await request(app)
        .put('/auth/profile')
        .send({})
        .set('Cookie', 'token=valid_token'); // Simulate cookie being sent in the request

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('No fields provided for update');
    });
  });

});
