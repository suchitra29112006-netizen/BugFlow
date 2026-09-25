# 🚂 BugFlow Railway Deployment Guide

This guide walks you through deploying **BugFlow** to Railway (**https://railway.app**) to get your live website link (e.g., `https://bugflow-production.up.railway.app`).

---

## ⚡ 1-Click / Fast GitHub Deployment on Railway

### Step 1: Push latest code to GitHub
Make sure all Railway configuration files (`Dockerfile`, `railway.toml`, `railway.json`, `Procfile`) are pushed to your GitHub repository (`suchitra29112006-netizen/BugFlow`).

### Step 2: Create a New Project on Railway
1. Go to **[https://railway.app/new](https://railway.app/new)**.
2. Select **Deploy from GitHub repo**.
3. Select your repository: **`suchitra29112006-netizen/BugFlow`**.
4. Click **Deploy Now**.

---

## 🗄️ Step 3: Add PostgreSQL Database (Recommended)

1. In your Railway Project Canvas, click **+ New** $\rightarrow$ **Database** $\rightarrow$ **Add PostgreSQL**.
2. Railway will spin up a managed PostgreSQL database automatically.
3. Click on the PostgreSQL service card $\rightarrow$ **Variables** tab $\rightarrow$ Copy the `DATABASE_URL` value.
4. Click on your `BugFlow` app service card $\rightarrow$ **Variables** tab $\rightarrow$ Add:
   - `DATABASE_URL` = `<pasted PostgreSQL DATABASE_URL>`
   - `JWT_SECRET_KEY` = `your_secure_random_jwt_secret_key_12345`
   - `ENVIRONMENT` = `production`
   - `SEED_DEMO_DATA` = `true`

---

## 🌐 Step 4: Generate Your Public Railway Link

1. Click on your `BugFlow` app service card in Railway.
2. Go to the **Settings** tab.
3. Scroll down to **Networking** / **Public Networking**.
4. Click **Generate Domain**.
5. Railway will instantly assign a public link, such as:
   `https://bugflow-production.up.railway.app`

---

## 🔍 Step 5: Verification & Login

Open your live Railway link:
`https://bugflow-production.up.railway.app`

### Default Demo Accounts:
- **Admin**: `admin@bugflow.io` / `admin123`
- **Developer**: `dev@bugflow.io` / `dev123`
- **QA**: `qa@bugflow.io` / `qa123`
