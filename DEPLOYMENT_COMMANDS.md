# Complete Deployment Commands

## Prerequisites
```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel
```

## Backend Deployment

### Step 1: Navigate to Server Directory
```bash
cd copy-of-wokring-yes/copy-of-wokring-yes/server
```

### Step 2: Deploy Backend to Vercel
```bash
vercel --prod
```

### Step 3: Note Your Backend URL
After deployment completes, Vercel will show you the URL like:
```
https://your-backend-name.vercel.app
```
**SAVE THIS URL** - you'll need it for frontend environment variables!

### Step 4: Set Backend Environment Variables in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your backend project
3. Go to Settings → Environment Variables
4. Add these variables:

```
MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
JWT_SECRET=etiquette-lms-jwt-secret-key-2026
PORT=3001
NODE_ENV=production
```

5. Click "Save" and redeploy if needed

## Frontend Deployment

### Step 1: Navigate to Frontend Directory
```bash
cd copy-of-wokring-yes/copy-of-wokring-yes
```

### Step 2: Set Environment Variables in Vercel Dashboard FIRST
**CRITICAL**: Before deploying, set these in Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Create a new project or select existing frontend project
3. Go to Settings → Environment Variables
4. Add these variables (replace `YOUR_BACKEND_URL` with actual backend URL from above):

```
VITE_API_URL=https://YOUR_BACKEND_URL.vercel.app/api
VITE_MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
VITE_JWT_SECRET=9f3d8a7b6c5e4d3f2a1b0c9d8e7f6a5c
VITE_ENABLE_REMOTE=true
VITE_USE_LOCAL_ADMIN=false
VITE_USE_LOCAL_EMPLOYEE=false
VITE_EMPLOYEE_LOGIN_DOMAIN=employees.local
VITE_PLATFORM_ADMIN_EMAIL=etiqettelms@gmail.com
VITE_PLATFORM_ADMIN_PASSWORD=Akshara@123
```

### Step 3: Deploy Frontend to Vercel
```bash
vercel --prod
```

### Step 4: Get Your Frontend URL
After deployment, Vercel will show:
```
https://your-frontend-name.vercel.app
```

## Verification Steps

### 1. Test Backend API
```bash
curl https://YOUR_BACKEND_URL.vercel.app/api/health
```
Expected response: `{"status":"ok","message":"API is running"}`

### 2. Test Backend Login
```bash
curl -X POST https://YOUR_BACKEND_URL.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"etiqettelms@gmail.com","password":"Akshara@123"}'
```
Expected: JSON response with token

### 3. Test Frontend
Open browser and visit: `https://YOUR_FRONTEND_URL.vercel.app`
- Should see landing page (not "Cannot GET /")
- Click "Login" button
- Try logging in with: `etiqettelms@gmail.com` / `Akshara@123`

## Troubleshooting

### Frontend Shows "Cannot GET /"
**Fix**:
1. Check environment variables are set in Vercel dashboard
2. Redeploy: `vercel --prod`
3. Clear browser cache (Ctrl+Shift+R)

### Backend 404 Error
**Fix**:
1. Verify `server/api/index.ts` exists
2. Check `server/vercel.json` has correct routing
3. Redeploy backend

### CORS Errors
**Fix**:
1. Check backend CORS configuration in `server/index.ts`
2. Verify frontend URL is allowed in CORS origins
3. Redeploy backend after changes

### Login Not Working
**Fix**:
1. Verify `VITE_API_URL` in frontend env vars points to correct backend URL
2. Test backend API directly with curl commands above
3. Check browser console for error messages
4. Verify MongoDB connection in backend logs

## Quick Redeploy Commands

### Redeploy Backend Only
```bash
cd copy-of-wokring-yes/copy-of-wokring-yes/server
vercel --prod
```

### Redeploy Frontend Only
```bash
cd copy-of-wokring-yes/copy-of-wokring-yes
vercel --prod
```

### Redeploy Both
```bash
# Backend
cd copy-of-wokring-yes/copy-of-wokring-yes/server
vercel --prod

# Frontend
cd ../
vercel --prod
```

## Important Notes

1. **Always deploy backend FIRST**, then frontend
2. **Update frontend `VITE_API_URL`** with backend URL before deploying frontend
3. **Environment variables** must be set in Vercel dashboard, not just in .env files
4. **Wait 1-2 minutes** after deployment for changes to propagate
5. **Clear browser cache** after redeployment to see changes

## Login Credentials

### Platform Admin
- Email: `etiqettelms@gmail.com`
- Password: `Akshara@123`

### Sample Employees
- Email: `john.doe@company.com` (or any employee email from database)
- Password: `employee123`
