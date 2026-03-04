# Frontend Deployment Fix - "Cannot GET /" Error

## Problem
Getting "Cannot GET /" error when accessing the Vercel-deployed frontend.

## Solution Applied

### 1. Updated vercel.json Configuration
- Added explicit `buildCommand` and `outputDirectory`
- Added `framework: "vite"` specification
- Added proper cache headers for static assets
- Configured SPA routing with rewrites

### 2. Required Environment Variables in Vercel Dashboard

You MUST add these environment variables in your Vercel project settings:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
VITE_JWT_SECRET=9f3d8a7b6c5e4d3f2a1b0c9d8e7f6a5c
VITE_ENABLE_REMOTE=true
VITE_USE_LOCAL_ADMIN=false
VITE_USE_LOCAL_EMPLOYEE=false
VITE_EMPLOYEE_LOGIN_DOMAIN=employees.local
VITE_PLATFORM_ADMIN_EMAIL=etiqettelms@gmail.com
VITE_PLATFORM_ADMIN_PASSWORD=Akshara@123
```

**IMPORTANT**: Replace `https://your-backend-url.vercel.app/api` with your actual backend Vercel URL!

## Deployment Steps

### Step 1: Set Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable above (one by one)
5. Make sure to select "Production", "Preview", and "Development" for each variable

### Step 2: Redeploy Frontend
```bash
cd copy-of-wokring-yes/copy-of-wokring-yes
vercel --prod
```

### Step 3: Verify Deployment
1. Wait for deployment to complete
2. Visit your frontend URL
3. You should see the landing page instead of "Cannot GET /"

## Common Issues and Fixes

### Issue 1: Still Getting "Cannot GET /"
**Solution**: 
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel deployment logs for build errors
- Verify all environment variables are set correctly

### Issue 2: Blank Page or Console Errors
**Solution**:
- Open browser console (F12)
- Check for CORS errors or API connection issues
- Verify `VITE_API_URL` points to your backend URL
- Make sure backend is deployed and running

### Issue 3: Login Not Working
**Solution**:
- Verify backend is accessible at the URL in `VITE_API_URL`
- Check backend environment variables are set
- Test backend API directly: `https://your-backend-url.vercel.app/api/health`

## Quick Test Commands

### Test Backend API
```bash
curl https://your-backend-url.vercel.app/api/health
```

### Test Frontend Build Locally
```bash
npm run build
npm run preview
```

## Files Modified
- `vercel.json` - Updated with proper Vite configuration

## Next Steps After Deployment
1. Test login with admin credentials: `etiqettelms@gmail.com` / `Akshara@123`
2. Test employee login with any employee email and password: `employee123`
3. Verify course catalog loads
4. Test course enrollment and progress tracking
