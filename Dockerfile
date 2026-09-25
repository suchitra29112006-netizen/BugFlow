# Multi-stage Dockerfile for Railway deployment of BugFlow

# Stage 1: Build React + Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend + Serve Production App
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/

# Copy Built Frontend Output into backend expected directory path
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Railway's dynamic PORT environment variable (default 8000)
ENV PORT=8000
EXPOSE 8000

# Set Working Directory to backend for FastAPI imports
WORKDIR /app/backend

# Launch Application with Uvicorn
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
