# E-Commerce API

An **E-Commerce REST API** with authentication, product management, orders, payments. The project comes with **Swagger API documentation**, a **frontend integration**, and **complete system design diagrams**.

---

## Live Deployments

**Swagger API Documentation**

* Primary Swagger UI: [Ngrok](https://1774f5e01c3d.ngrok-free.app/api-dics)
  *Note: This endpoint may not always be available due to resource limitations.*

* Secondary Swagger UI (Render deployment): [Render](https://ecommerce-api-p9om.onrender.com/api-docs)
  *Note: As this is a free-tier deployment, the first request may take a few seconds while the server spins up.*

**Frontend Application**

* Frontend URL: [Vercel](https://stripe-checkout-beta.vercel.app/)
  *The frontend is connected to the backend hosted on Render.*

**Design & Architecture**

* Entity Relationship Diagram (ERD): [ERD](https://github.com/raihan-sust20/ecommerce-api/blob/main/ERD.mermaid)
* System Architecture Diagram: [Architecture](https://github.com/raihan-sust20/ecommerce-api/blob/main/system-architecture.txt)
* Stripe Payment Flow Diagram: [Stripe Payment Flow](https://github.com/raihan-sust20/ecommerce-api/blob/main/Stripe-Payment-Flow.mermaid)
---

## Features

* User authentication and role management (admin, customer)
* JWT-based secure access
* Product, category, order, and payment management
* Stripe payment integration with webhook support
* Rate-limiting and security middlewares
* Comprehensive Swagger API documentation
* Designed with modular architecture for scalability

---

## Tech Stack

* **Backend:** Node.js, TypeScript, Express.js, NestJS patterns
* **Database:** PostgreSQL
* **ORM / DI:** TypeORM, tsyringe for dependency injection
* **Frontend:** Next.js, Stripe Checkout integration
* **Documentation:** Swagger
* **Containerization:** Docker & Docker Compose

---

## Running Locally with Docker Compose

Spin up the API and database quickly using Docker Compose:

1. **Clone the repository**

```bash
git clone https://github.com/raihan-sust20/ecommerce-api.git
cd ecommerce-api
```

2. **Create `.env` file**
   Copy `.env.example` to `.env` and update environment variables as needed:

```bash
cp .env.example .env
```

3. **Run Docker Compose**

```bash
docker compose up --build
```

4. **Access the services**

* Backend API: `http://localhost:5001/api/v1`
* Swagger UI: `http://localhost:5001/api-docs`
* PostgreSQL (if needed): `localhost:5433`

5. **Stop the services**

```bash
docker compose down
```

*Tip:* Docker Compose automatically creates a network for the backend and database, so no additional configuration is required.
