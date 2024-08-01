# E-commerce API

This is a RESTful API for an E-commerce application built with Node.js, Express.js, and MySQL. The API allows for the management of products, categories, and user authentication.

## Deployment
 Deployed on Heroku.
 
 ```https://ecommerce-backend01-00e0e54018da.herokuapp.com ```

 
## Features

- User Registration and Authentication
- CRUD operations for Products and Categories
- Role-based access control (only admins can create, update, and delete products and categories)
- Secure password storage with bcrypt
- Input validation and sanitization
- JWT-based authentication with cookies

## Technologies Used

- Node.js
- Express.js
- MySQL (XAAMP for local development)
- bcrypt
- JWT
- xss
- Jest (for testing)
- Swagger (OpenAPI) for API documentation ```https://ecommerce-backend01-00e0e54018da.herokuapp.com/api-docs```

## Setup and Installation

### Prerequisites

- Node.js (LTS version recommended)
- XAAMP (for MySQL)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/talha-ansarii/E-Commerce-backend.git
    cd E-Commerce-backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=3000
    DB_HOST="YOUR DB HOST"
    DB_USER="YOUR DB USERNAME"
    DB_PASSWORD="YOUR DB PASSWORD"
    DB_NAME="YOUR DB NAME"
    JWT_SECRET="YOUR JWT SECRET"
    NODE_ENV=development/production
    ```

4. Set up the MySQL database using XAAMP:
    - Start XAAMP and create a database named `ecommerce`.
    - Import the SQL script provided in the `schema.sql` file to create the necessary tables.

5. Run the server:
    ```sh
    npm start
    ```

The API will be available at `http://localhost:3000`.

## Usage

### Endpoints

#### Auth

- **Register**
  - `POST /auth/register`
  - Request Body:
    ```json
    {
      "username": "new_user",
      "email": "new_user@example.com",
      "password": "securepassword",
      "role": "user"
    }
    ```

- **Login**
  - `POST /auth/login`
  - Request Body:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```

- **Logout**
  - `POST /auth/logout`

- **Get Profile**
  - `GET /auth/profile`

- **Update Profile**
  - `PUT /auth/profile`
  - Request Body:
    ```json
    {
      "username": "updated_user",
      "email": "updated_user@example.com",
      "password": "newsecurepassword",
      "role": "admin"
    }
    ```

#### Products

- **Get All Products**
  - `GET /products`

- **Get Product by ID**
  - `GET /products/:id`

- **Create Product** (Admin only)
  - `POST /products`
  - Request Body:
    ```json
    {
      "name": "Product Name",
      "description": "Product Description",
      "price": 99.99,
      "stock": 10,
      "categoryName" : "Product Category"
    }
    ```

- **Update Product** (Admin only)
  - `PUT /products/:id`
  - Request Body (any field can be updated):
    ```json
    {
      "name": "Updated Name",
      "description": "Updated Description",
      "price": 89.99,
      "stock": 5
    }
    ```

- **Delete Product** (Admin only)
  - `DELETE /products/:id`

#### Categories

- **Get All Categories**
  - `GET /categories`

- **Get Category by ID**
  - `GET /categories/:id`

- **Create Category** (Admin only)
  - `POST /categories`
  - Request Body:
    ```json
    {
      "name": "Category Name",
      "description" : "Category Description"
    }
    ```

- **Update Category** (Admin only)
  - `PUT /categories/:id`
  - Request Body:
    ```json
    {
      "name": "Updated Category Name",
      "description":"Updated Category Description"
    }
    ```

- **Delete Category** (Admin only)
  - `DELETE /categories/:id`

## Testing

To run tests, use the following command:
```sh
npm test
