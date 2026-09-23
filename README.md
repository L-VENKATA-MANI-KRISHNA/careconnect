# CareConnect — MERN Home Services Marketplace

CareConnect is a production-grade home services marketplace connecting customers with verified trade and service professionals across key categories (Plumbing, Electrical, Cleaning, Appliance Repair, HVAC, Carpentry, Painting, Pest Control, General Maintenance).

## Architecture

- **Frontend**: React 18, Vite, React Router v6, Axios, Custom Responsive Design System
- **Backend**: Node.js, Express.js, Mongoose, Helmet, Cookie-Parser, CORS, Morgan
- **Database**: MongoDB (Local or MongoDB Atlas)
- **AI Engine**: Service request classification and provider ranking with deterministic fallbacks

## Folder Structure

```
careconnect/
├── frontend/             # React + Vite client
│   ├── src/
│   │   ├── api/          # Axios HTTP client
│   │   ├── assets/       # Static assets & styles
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # Application state contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Dashboard and public layouts
│   │   ├── pages/        # Route page views
│   │   ├── routes/       # Route definitions & guards
│   │   ├── services/     # Frontend business services
│   │   ├── utils/        # Constants and helpers
│   │   ├── App.jsx       # Root component
│   │   ├── index.css     # Global styles & design system
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Environment & database connection
│   │   ├── controllers/  # Request handler logic
│   │   ├── middleware/   # Authentication, RBAC, error handlers
│   │   ├── models/       # Mongoose data models
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic & algorithms
│   │   ├── validators/   # Request validation schemas
│   │   ├── utils/        # Response formatters, logger
│   │   ├── ai/           # AI classification & provider matching
│   │   ├── jobs/         # Scheduled maintenance jobs
│   │   ├── app.js        # Express app configuration
│   │   └── server.js     # Entry point & DB connection
│   ├── tests/            # Automated test suite
│   ├── package.json
│   └── .env.example
│
├── docs/                 # API documentation & architecture guides
├── .env.example          # Environment variables template
├── .gitignore
├── README.md
└── IMPLEMENTATION_STATUS.md
```

## Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- MongoDB Server running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Backend runs on: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

## Demo Credentials (Development)
- **Admin**: `admin@careconnect.local` / `Pass123!@#`
- **Operations Manager**: `operations@careconnect.local` / `Pass123!@#`
- **Support Agent**: `support@careconnect.local` / `Pass123!@#`
- **Provider**: `provider1@careconnect.local` / `Pass123!@#`
- **Customer**: `customer1@careconnect.local` / `Pass123!@#`
