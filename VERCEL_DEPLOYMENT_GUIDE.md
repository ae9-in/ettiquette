# Vercel Deployment Guide

## 📦 Deployment Overview

This guide will help you deploy both the frontend and backend to Vercel.

---

## 🎯 Deployment Strategy

We'll deploy in two parts:
1. **Backend API** - Separate Vercel project
2. **Frontend** - Main Vercel project

---

## 🔧 Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Vercel CLI (optional): `npm install -g vercel`

---

## 📝 Step 1: Prepare Backend for Deployment

### 1.1 Update Backend Package.json

Add build script to `server/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "vercel-build": "echo 'No build needed for serverless'"
  }
}
```

### 1.2 Create API Entry Point

The `server/index.ts` is already configured for Vercel serverless functions.

---

## 🚀 Step 2: Deploy Backend to Vercel

### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your repository
3. Select the `server` folder as root directory
4. Add environment variables:
   - `MONGODB_URI`: `mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900`
   - `JWT_SECRET`: `etiquette-lms-jwt-secret-key-2026`
   - `PORT`: `3001` (optional)
5. Click "Deploy"

### Option B: Via Vercel CLI

```bash
cd server
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? etiquette-lms-api
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add MONGODB_URI
# Paste: mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900

vercel env add JWT_SECRET
# Paste: etiquette-lms-jwt-secret-key-2026

# Deploy to production
vercel --prod
```

### 1.3 Note Your Backend URL

After deployment, you'll get a URL like:
```
https://etiquette-lms-api.vercel.app
```

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Environment Variables

Update `.env.local` or create `.env.production`:

```env
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_JWT_SECRET=etiquette-lms-jwt-secret-key-2026
VITE_MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
```

### 3.2 Deploy Frontend

#### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your repository
3. Select root directory (not server folder)
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add environment variables:
   - `VITE_API_URL`: `https://your-backend-url.vercel.app/api`
   - `VITE_JWT_SECRET`: `etiquette-lms-jwt-secret-key-2026`
8. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# From project root
vercel

# Follow prompts
# Add environment variables
vercel env add VITE_API_URL production
# Paste your backend URL

vercel env add VITE_JWT_SECRET production
# Paste: etiquette-lms-jwt-secret-key-2026

# Deploy to production
vercel --prod
```

---

## 🔒 Step 4: Configure CORS

Update `server/index.ts` to allow your frontend domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true
}));
```

Redeploy backend after this change.

---

## ✅ Step 5: Verify Deployment

### Test Backend
```bash
curl https://your-backend-url.vercel.app/api/profiles
# Should return 401 Unauthorized (expected without token)
```

### Test Frontend
1. Open your frontend URL
2. Try logging in with:
   - Email: `etiqettelms@gmail.com`
   - Password: `Akshara@123`
3. Check if data loads correctly

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Cannot find module**
- Make sure all dependencies are in `package.json`
- Run `npm install` before deploying

**Error: MongoDB connection failed**
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check environment variables are set correctly

**Error: 500 Internal Server Error**
- Check Vercel function logs
- Verify JWT_SECRET is set

### Frontend Issues

**Error: API calls failing**
- Verify `VITE_API_URL` points to correct backend URL
- Check CORS configuration in backend
- Ensure backend is deployed and running

**Error: Build failed**
- Check all imports are correct
- Verify all dependencies are installed
- Check for TypeScript errors

---

## 📊 Environment Variables Summary

### Backend (server)
```
MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
JWT_SECRET=etiquette-lms-jwt-secret-key-2026
```

### Frontend
```
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_JWT_SECRET=etiquette-lms-jwt-secret-key-2026
```

---

## 🔄 Continuous Deployment

Once set up, Vercel will automatically deploy:
- **Backend**: When you push to `server/` folder
- **Frontend**: When you push to root

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Login works
- [ ] Data loads from MongoDB Atlas
- [ ] All API endpoints working
- [ ] Custom domain configured (optional)

---

## 🎉 Success!

Your Etiquette LMS is now deployed to Vercel!

**URLs:**
- Frontend: https://your-project.vercel.app
- Backend API: https://your-api.vercel.app

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)

---

## 🔐 Security Notes

1. Never commit `.env` files to Git
2. Use Vercel environment variables for secrets
3. Enable MongoDB Atlas IP whitelist (or use 0.0.0.0/0 for Vercel)
4. Rotate JWT_SECRET regularly
5. Use HTTPS only in production

---

**Ready to deploy? Follow the steps above!** 🚀
