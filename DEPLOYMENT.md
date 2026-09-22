# 🚀 BugFlow Production Deployment Guide

This document outlines the step-by-step instructions to deploy **BugFlow** using the target production architecture:

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

## 🛠️ Environment Variables Matrix

### Backend Environment Variables (Render)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:pass@host:5432/bugflow` |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | `YOUR_SECURE_RANDOM_JWT_SECRET` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://YOUR-BUGFLOW-APP.vercel.app` |
| `ENVIRONMENT` | Application execution environment | `production` |
| `SEED_DEMO_DATA` | Seed initial demo data on fresh DB | `true` |
| `GEMINI_API_KEY` | (Optional) Google Gemini API Key for AI features | `YOUR_GEMINI_API_KEY` |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `VITE_API_URL` | Production FastAPI Backend API URL | `https://YOUR-RENDER-BACKEND.onrender.com` |

---

## Step 1: Commit and Push Code to GitHub

Open terminal in the project root:

```bash
git status
git add .
git commit -m "feat: Prepare BugFlow for production Vercel + Render + PostgreSQL deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database on Render

1. Log in to **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **New +** $\rightarrow$ **PostgreSQL**.
3. Set **Name**: `bugflow-postgres`
4. Set **Database**: `bugflow`
5. Set **User**: `bugflow_user`
6. Select **Free** plan.
7. Click **Create Database**.
8. Copy the **Internal Database URL** (or External Database URL).

---

## Step 3: Deploy FastAPI Backend on Render

1. On Render, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `suchitra29112006-netizen/BugFlow`.
3. Configure the settings:
   - **Name**: `bugflow-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **Free**.
4. Add Environment Variables under **Environment**:
   - `DATABASE_URL` = `<your PostgreSQL internal database URL>`
   - `JWT_SECRET_KEY` = `<strong random secret key>`
   - `CORS_ORIGINS` = `https://YOUR-BUGFLOW-APP.vercel.app`
   - `ENVIRONMENT` = `production`
   - `SEED_DEMO_DATA` = `true`
   - `GEMINI_API_KEY` = `<your gemini key optional>`
5. Click **Create Web Service**.
6. Once deployed, test the health check endpoint:
   ```text
   GET https://YOUR-RENDER-BACKEND.onrender.com/health
   ```
   Should return `{"status": "ok", "database": "connected"}`.

---

## Step 4: Deploy React Frontend on Vercel

1. Log in to **[vercel.com/new](https://vercel.com/new)** with GitHub.
2. Select your repository `BugFlow` and click **Import**.
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables**:
   - `VITE_API_URL` = `https://YOUR-RENDER-BACKEND.onrender.com`
5. Click **Deploy**.

Vercel will build your static React app and give you a live production URL:
`https://YOUR-BUGFLOW-APP.vercel.app`

---

## Step 5: Final Verification & Health Check

1. **API Health**: Visit `https://YOUR-RENDER-BACKEND.onrender.com/health` to confirm FastAPI + PostgreSQL connectivity.
2. **Frontend SPA & Auth**: Visit `https://YOUR-BUGFLOW-APP.vercel.app`.
3. **Login Test**: Sign in with default demo accounts:
   - Admin: `admin@bugflow.io` / `admin123`
   - Developer: `dev@bugflow.io` / `dev123`
   - QA: `qa@bugflow.io` / `qa123`
4. **Client-Side Routing**: Refresh pages on nested routes (`/projects`, `/documents/1`, `/sprints`, `/goals`) to verify Vercel single-page application routing.
