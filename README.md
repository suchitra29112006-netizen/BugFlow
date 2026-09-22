# BugFlow v3.5 — AI-Native Engineering Intelligence & Defect Management Platform

BugFlow is an enterprise-grade AI-native software defect lifecycle management and engineering intelligence platform built for software teams, architects, QA leads, and engineering managers.

---

## 🏗️ Production Architecture

```text
                    BUGFLOW USER
                         |
                         v
              +----------------------+
              | Vercel               |
              | React + Vite         |
              | Production Frontend  |
              +----------+-----------+
                         |
                         | HTTPS API
                         v
              +----------------------+
              | Render               |
              | FastAPI Backend      |
              | Production API       |
              +----------+-----------+
                         |
                         | SQLAlchemy
                         v
              +----------------------+
              | PostgreSQL           |
              | Production Database  |
              +----------------------+
```

---

## 🚀 Technology Stack

- **Frontend**: React 18, Vite, Recharts, Lucide Icons, Single-Page Application (SPA) Client Routing
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.x, Pydantic v2, Uvicorn, Gunicorn
- **Database**:
  - **Local Development**: SQLite (`sqlite:///./bugflow.db`)
  - **Production**: PostgreSQL (`postgresql+psycopg://...`) via environment variable
- **Authentication & RBAC**: JWT (JSON Web Tokens), bcrypt password hashing, 4-tier Role Based Access Control (Admin, Developer, QA, Reporter)
- **AI Engine**: Google Gemini AI integrations for defect report generation, AI investigation workspaces, release intelligence, and Knowledge Hub copilot Q&A.

---

## 💻 Local Development Setup

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend API will be running at `http://localhost:8000`.
Swagger API Docs available at `http://localhost:8000/docs`.
API Health Check at `http://localhost:8000/health`.

### 2. Frontend Setup (React Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend development app will be running at `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend Environment Variables (`backend/.env.example`)

- `DATABASE_URL`: Connection string. Defaults to `sqlite:///./bugflow.db` locally. Set to PostgreSQL URI in production.
- `JWT_SECRET_KEY`: Secret key for signing JWT tokens.
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins (e.g. `https://YOUR-BUGFLOW-APP.vercel.app`).
- `ENVIRONMENT`: `development` | `production`.
- `SEED_DEMO_DATA`: `true` | `false`. Controls initial demo data population when DB is empty.
- `GEMINI_API_KEY`: Optional Google Gemini API key for AI features.

### Frontend Environment Variables (`frontend/.env.example`)

- `VITE_API_URL`: Production FastAPI backend URL (e.g. `https://YOUR-RENDER-BACKEND.onrender.com`).

---

## 🌐 Production Deployment

Refer to **[DEPLOYMENT.md](file:///C:/Users/suchi/.gemini/antigravity/scratch/BugFlow/DEPLOYMENT.md)** for detailed step-by-step instructions on deploying:
1. **Frontend** on Vercel.
2. **Backend** on Render Web Service.
3. **Database** on Render Managed PostgreSQL.

---

## 🔑 Default Demo Credentials

When `SEED_DEMO_DATA=true` (enabled by default on empty databases), BugFlow pre-seeds initial demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bugflow.io` | `admin123` |
| Developer | `dev@bugflow.io` | `dev123` |
| QA | `qa@bugflow.io` | `qa123` |
| Reporter | `reporter@bugflow.io` | `reporter123` |

---

## 🔐 Security Notes

- Never commit `.env` or secret files to version control (`.gitignore` protects secret files).
- Always use HTTPS in production.
- Set strong production keys for `JWT_SECRET_KEY` and database credentials.
