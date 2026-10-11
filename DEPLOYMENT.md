# 🚀 KIRA Production Deployment Cookbook

This cookbook guides you step-by-step through deploying the full **KIRA (PromptForge)** stack:
1. **Frontend**: Firebase Hosting (or Vercel)
2. **Backend API**: Render or Railway (FastAPI + Groq LPU)
3. **Database**: Neon Serverless PostgreSQL with `pgvector`
4. **Auth**: Firebase Google Sign-In

---

## 📋 Pre-Flight Checklist: What You Need
- [ ] Free account at [Neon.tech](https://neon.tech)
- [ ] Free API key at [Groq Console](https://console.groq.com)
- [ ] Free account at [Firebase Console](https://console.firebase.google.com)
- [ ] Free account at [Render.com](https://render.com) or [Railway.app](https://railway.app)
- [ ] Node.js 18+ and Python 3.11+ installed locally

---

## Step 1: Database Setup (Neon PostgreSQL)
1. Log in to [Neon.tech](https://neon.tech) and create a project named `kira-production`.
2. Neon automatically creates a database named `neondb`.
3. In the Neon Dashboard, copy the connection string:
   ```text
   postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. *Note: KIRA's `database.py` automatically initializes all required tables (`profiles`, `memories`, `history`, `projects`) on the first startup!*

---

## Step 2: Backend Deployment (Render.com)
1. Push your repository to GitHub: `https://github.com/Carltonkenny/KIRA`
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
3. Select your repository: `Carltonkenny/KIRA`.
4. Configure the Web Service settings:
   - **Name**: `kira-backend`
   - **Region**: US East (Ohio) or nearest to your Neon DB
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables** in the Render UI:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `GROQ_API_KEY` | `gsk_...` | From console.groq.com |
   | `DATABASE_URL` | `postgresql://...` | Pooled connection string from Neon |
   | `ALLOWED_ORIGINS` | `*` | Or your Firebase / Vercel frontend URL |
   | `PORT` | `8090` | (Render will bind to its assigned port) |
6. Click **Deploy Web Service**.
7. Once deployed, test the health check in your browser:
   `https://kira-backend.onrender.com/health` → `{"status": "healthy", ...}`

---

## Step 3: Firebase Auth Setup (Google Sign-In)
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `kira-app`).
2. Navigate to **Build** → **Authentication** → **Get started**.
3. In **Sign-in method**, enable **Google**. Set your support email and click Save.
4. Go to **Project Settings** (gear icon) → **General** → **Your apps** → Click the Web icon (`</>`).
5. Register app name `kira-web`. Copy the configuration keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Step 4: Frontend Deployment

### Option 4A: Deploy to Firebase Hosting (Recommended)
1. In `frontend`, create `.env.production` with your keys:
   ```ini
   VITE_API_URL=https://kira-backend.onrender.com
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   ```
2. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
3. Deploy with Firebase CLI:
   ```bash
   # Log in if needed
   firebase login

   # Deploy the pre-configured firebase.json
   firebase deploy --only hosting
   ```
4. Copy the live hosting URL (e.g. `https://your-project.web.app`).
5. In **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**, ensure your URL (`your-project.web.app`) is listed!

---

### Option 4B: Deploy to Vercel
1. Go to [Vercel](https://vercel.com) → **Add New** → **Project** → Import `Carltonkenny/KIRA`.
2. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: `https://kira-backend.onrender.com`
   - `VITE_FIREBASE_API_KEY`: *(Your key)*
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-project.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `your-project`
4. Click **Deploy**.
5. Add your Vercel domain (`*.vercel.app`) to **Authorized domains** in Firebase Authentication settings.

---

## Step 5: Connecting Coding Agents to Cloud MCP (SSE)
Developers using **Claude Code**, **Antigravity**, or **Cursor** can connect directly to your deployed backend without installing anything locally:

In their project root:
```markdown
# Agent Directive
Connect to KIRA Cloud MCP:
SSE URL: https://kira-backend.onrender.com/mcp/sse
Before executing complex code, execute `kira_enhance` to inject active memory and boundaries.
```
