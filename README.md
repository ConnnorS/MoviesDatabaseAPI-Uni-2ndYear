# Movie Database REST API (Server-Side)

This project is a **server-side implementation** of a movie database REST API, developed as part of my second-year CAB230 coursework. It builds on a client-side React app I created in a previous assignment, by creating and deploying the **backend server** that powers the API.

The API provides information about movies and the people involved in their creation, using a provided dataset, and includes **user authentication, JWT-based security, and profile management**.

---

## Features Implemented

### Core Technologies
- **Node.js** and **Express** for the backend
- **MySQL** (via **Knex.js**) for database operations
- **Swagger** for API documentation
- **JSON Web Tokens (JWT)** for authentication and authorization

### API Endpoints
- `GET /movies/search` – Search movies by criteria
- `GET /movies/data/{imdbID}` – Retrieve detailed movie data
- `GET /people/{id}` – Retrieve information about a specific person
- **User Management:**
  - Registration, login, and token refresh
  - `GET /user/{email}/profile` – View public or private user profile
  - `PUT /user/{email}/profile` – Update your own profile details (with validation and permissions)

### Security
- JWT verification and expiry handling
- Access control for profile editing
- Input validation and error handling
- HTTPS deployment with a self-signed certificate

### Deployment
- Deployed to a QUT-provided VM
- Accessible over HTTPS with Swagger docs served on the home route

---

## Skills Learned

By completing this project, I developed and strengthened skills in:

- **Backend Development:** Designing and implementing RESTful APIs with Express
- **Database Integration:** Using Knex.js to interact with MySQL databases
- **Authentication & Authorization:** Implementing secure login flows with JWTs
- **API Documentation:** Writing and maintaining Swagger/OpenAPI specifications
- **Error Handling & Validation:** Returning structured, meaningful HTTP error responses
- **Deployment & Security:** Setting up HTTPS servers and deploying to a remote Linux VM
- **Code Organization:** Using middleware, routers, and modular structure for scalability

---