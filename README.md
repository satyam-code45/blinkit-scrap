# 💼 Blinkit Product Scraper



https://github.com/user-attachments/assets/86aded1a-b36e-4c16-84b9-1fa61760000d

A backend API built using Node.js and TypeScript to scrape product details from Blinkit. It simulates user login and allows authenticated users to fetch product data using Puppeteer.

---

## 🚀 Features

* OTP-based login using phone number
* Scrapes product data from Blinkit
* Dockerized for easy setup
* Modular TypeScript backend

---

## 📂 Project Structure

```
backend/
│
├── dist/                   # Compiled JS files
├── node_modules/
├── screenshots/            # Puppeteer screenshots (if any)
├── src/
│   ├── api/                # API route handlers
│   │   ├── cart.ts
│   │   └── login.ts
│   ├── browser/            # Puppeteer logic
│   │   └── puppeteer.ts
│   ├── db/                 # MongoDB & Redis logic
│   │   ├── mongo.ts
│   │   └── redis.ts
│   ├── utils/
│   │   └── pageSessionManager.ts
│   └── server.ts           # Express server entry point
│
├── .env                    # Environment variables
├── Dockerfile              # Backend Docker setup
├── docker-compose.yml      # Docker services (mongo, redis, backend)
├── package.json
├── tsconfig.json
└── README.md               # Project documentation
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/satyam-code45/blinkit-scrap.git
cd blinkit-scrap/backend
```

### 2. Add `.env` File

Create a `.env` file inside the `backend` directory with the necessary environment variables (like `PORT`, `MONGO_URI`, `REDIS_URL`, etc.).

Example:

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/grocery
REDIS_URL=redis://redis:6379
```

### 3. Install dependencies and build

```bash
npm install
npm run build
```

### 4. Start the services using Docker

```bash
docker compose up -d --build
```

---

## 🔌 API Endpoints

### 🔐 1. Login

**POST** `/api/login`

```json
{
  "phone_number": "123456789"
}
```

---

### 🔑 2. Submit OTP

**POST** `/api/submit-otp`

```json
{
  "phone_number": "123456789",
  "otp": "9722"
}
```

---

### 🏍️ 3. Add Product URL

**POST** `/api/add-products`

```json
{
  "products_url": "https://blinkit.com/prn/kelloggs-chocos-crunchy-bites-kids-cereal-pringles-sour-cream-onion-potato-chips-40-g-combo/prid/578634",
  "phone_number": "123456789"
}
```

---

## 🐳 Docker Services

* **Node.js (Express API)** – Port: `3000`
* **MongoDB** – Port: `27017`
* **Redis** – Port: `6379`

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

* [Puppeteer](https://pptr.dev/)
* [Express.js](https://expressjs.com/)
* [Docker](https://www.docker.com/)
