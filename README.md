# Zomato Clone Backend

Node.js + Express backend for a multi-role food ordering platform. This API handles authentication, restaurant/menu management, cart and orders, coupons, ratings, admin operations, delivery assignment, email notifications, and Razorpay payment verification.

## Tech Stack

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing
- Nodemailer (Gmail)
- Cloudinary (image upload)
- Multer
- Razorpay
- CORS + dotenv

## Core Features

- JWT-based login/logout and role-based authorization
- User registration, profile update, and availability status update
- Forgot password + reset password via email link
- Restaurant creation and listing
- Owner menu item CRUD with image upload
- Cart management and checkout summary
- Order lifecycle for customer, owner, admin, and delivery partner
- Delivery partner assignment/claim/update flows
- Coupon creation and listing for restaurant owners
- Restaurant rating support
- Admin dashboard, analytics, user/order moderation, and delivery partner management
- Razorpay order creation and signature verification

## API Base URL

Default local base URL:

http://localhost:<PORT>/api

If PORT=5000, then full API base is:

http://localhost:5000/api

## Route Map

### User Routes (/api/users)

- POST /register
- POST /login
- POST /logout
- GET /profile
- PUT /profile
- PUT /profile/availability
- POST /forgot-password
- POST /reset-password/:token

### Admin Routes (/api/admin)

- GET /dashboard
- GET /users
- GET /users/:id
- GET /users/:id/orders
- PUT/PATCH /users/:id/block
- GET /orders
- PUT /orders/:id/status
- PUT /orders/:id/refund
- GET /analytics
- GET /delivery-partners
- POST /delivery-partners
- DELETE /delivery-partners/:id
- PUT /restaurants/:id/offers

### Restaurant Routes (/api/restaurants)

- POST /
- GET /
- GET /:id

### Menu Routes (/api/menu)

- POST /
- GET /owner
- PUT /:id
- DELETE /:id
- GET /:restaurantId

### Cart Routes (/api/cart)

- POST /
- GET /
- DELETE /:itemId
- POST /checkout
- POST /summary

### Order Routes (/api/orders)

- POST /
- GET /my-orders
- GET /restaurant
- GET /restaurant/analytics
- PUT /:id/status
- PUT /:id/cancel
- PUT /:id/pay
- PUT /:id/assign
- GET /delivery
- PUT /:id/delivery-status
- PUT /:id/claim
- DELETE /:id/cancel-pending

### Coupon Routes (/api/coupons)

- POST /
- GET /mine

### Rating Routes (/api/ratings)

- POST /

### Payment Routes (/api/payment)

- POST /create-order
- POST /verify-payment

## Project Structure

Backend/

- config/ Database, Cloudinary, email config
- controllers/ Route handler logic
- middleware/ Auth, role authorization, upload middleware
- models/ Mongoose schemas
- routes/ API routes
- server.js App bootstrap and route mounting

## Environment Variables

Create a .env file inside Backend/ with:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_USER_ID=your_jwt_secret
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret

Production suggestion for FRONTEND_URL:

FRONTEND_URL=https://zomato-frontend-rosy.vercel.app

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas or local MongoDB

## Installation and Run

1. Install dependencies:

npm install

2. Start server (nodemon):

npm start

The app starts from server.js and listens on PORT.

## Auth and Access Control

- Auth middleware expects Bearer JWT token.
- Role middleware protects admin/owner/delivery-only routes.
- Standard roles used in project:
  - customer
  - admin
  - restaurant_owner
  - delivery_partner

## External Services Setup

### MongoDB

- Create database and set MONGO_URI.

### Razorpay

- Add RAZORPAY_KEY_ID and RAZORPAY_SECRET.
- Frontend must use matching public key.

### Cloudinary

- Required for image uploads (restaurants/menu items).

### Gmail SMTP (Nodemailer)

- Use EMAIL_USER and EMAIL_PASS.
- For Gmail, use App Password (not regular account password).

## Health Check

GET /

Response:

Zomato Clone API is running...

## Common Issues

- Mongo connection failure:
  - Verify MONGO_URI and network whitelist.
- JWT invalid token errors:
  - Check JWT_SECRET_USER_ID consistency.
- CORS blocked requests:
  - Ensure FRONTEND_URL matches frontend origin.
- Email not sending:
  - Validate Gmail app password and SMTP access.
- Razorpay verify failure:
  - Confirm RAZORPAY_SECRET and signature payload fields.
