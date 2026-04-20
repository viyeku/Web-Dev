# Marketa

Marketa is a marketplace web application built with Angular and Django REST Framework.

The project supports two user roles:

- Buyer: can browse products, search and filter the catalog, add products to favorites and cart, place orders, and view order history.
- Seller: has all buyer features and can also create, edit, activate/deactivate, and soft-delete their own products, view sales history, and track seller statistics.

## Team

- Vilen Gridasov (ID: 24B030292)
- Tukubayev Kudaibergen (ID: 24B031114)
- Onarbay Yertay (ID: 21B030892)

## Tech Stack

- Frontend: Angular
- Backend: Django, Django REST Framework
- Authentication: JWT with Simple JWT
- Database: SQLite
- API testing/documentation: Postman
- Media: Django media storage for product images

## Main Features

- JWT registration, login, session restore, and logout.
- Role-based behavior for buyers and sellers.
- Product catalog with categories, search, sorting, and seller search.
- Product cards and detailed product pages with images and reviews.
- Seller product CRUD with image upload and validation.
- Soft-delete for products so order and sales history remain safe.
- Favorites stored in the database.
- Cart stored in the database.
- Checkout flow that creates orders and decreases product stock.
- Order history for buyers.
- Sales history and sales statistics for sellers.
- Product price snapshot in orders via unit_price, so old order history does not change after product price edits.
- Centralized frontend notifications for success and error messages.
- Postman collection with request templates and example responses.

## Project Structure

Web-Dev/
  marketa-frontend/      Angular application
  marketa-backend/       Django REST API
  postman/               Postman collection
  presentation/          Defense presentation template

## Frontend Overview

Important frontend files:

- marketa-frontend/src/app/app.routes.ts defines routes.
- marketa-frontend/src/app/app.html contains the main navigation shell.
- marketa-frontend/src/app/services/api.ts contains API requests.
- marketa-frontend/src/app/services/auth.service.ts manages JWT session state.
- marketa-frontend/src/app/auth.interceptor.ts attaches JWT tokens to protected requests.
- marketa-frontend/src/app/services/cart.service.ts manages cart state.
- marketa-frontend/src/app/services/favorites.service.ts manages favorites state.
- marketa-frontend/src/app/shared/notifications/ contains centralized toast notifications.
- marketa-frontend/src/app/components/product-card/ contains the reusable product mini-card.

Main pages:

- /login
- /register
- /products
- /products/:id
- /favorites
- /cart
- /my-products
- /account

## Backend Overview

Important backend files:

- marketa-backend/api/models.py defines database models.
- marketa-backend/api/serializers.py defines API serializers.
- marketa-backend/api/views/fbv.py contains function-based API views.
- marketa-backend/api/views/cbv.py contains APIView-based views.
- marketa-backend/api/views/viewsets.py contains the product CRUD viewset.
- marketa-backend/api/urls.py defines API routes.
- marketa-backend/config/settings.py contains DRF, JWT, CORS, static, and media settings.

Main models:

- Category
- UserProfile
- Product
- Favorite
- Cart
- CartItem
- Order
- Review

## API Highlights

Base API URL:

http://localhost:8000/api

Main endpoints:

- POST /api/register/
- POST /api/login/
- POST /api/token/refresh/
- POST /api/logout/
- GET/PATCH /api/me/
- GET /api/categories/
- GET/POST /api/products/
- GET/PATCH/DELETE /api/products/:id/
- GET /api/products/mine/
- GET /api/cart/
- POST /api/cart/add/
- PATCH/DELETE /api/cart/items/:id/
- POST /api/cart/checkout/
- GET/POST /api/favorites/
- DELETE /api/favorites/:product_id/
- GET /api/orders/
- GET /api/sales/
- GET /api/seller/stats/
- GET/POST /api/products/:product_id/reviews/

## Postman

The Postman collection is located at:

postman/marketa-api.postman_collection.json

It includes all main API requests, collection variables, request body templates, JWT token-saving scripts, and example responses.

Recommended flow:

1. Run backend.
2. Import the collection into Postman.
3. Run Login or Register.
4. The collection saves access_token and refresh_token.
5. Use protected requests such as cart, favorites, checkout, product creation, orders, and sales.

## Run Backend

cd marketa-backend
venv\Scripts\activate
python manage.py migrate
python manage.py runserver

Backend URL:

http://localhost:8000

## Run Frontend

cd marketa-frontend
npm install
npx ng serve

Frontend URL:

http://localhost:4200