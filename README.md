# CSV Real-Time App

A full-stack real-time CSV file management application with WebSocket support.

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Access the App

- **URL**: http://localhost:5173
- **Default Login**: Use signup or existing credentials
- **Admin Features**: Upload and delete files (admin role only)

## Features

- 🔐 User authentication with JWT tokens
- 📤 File upload with real-time synchronization
- 🔄 WebSocket-based live updates
- 👥 Admin and user role management
- 📊 CSV file viewer and management
