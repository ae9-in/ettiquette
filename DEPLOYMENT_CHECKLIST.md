# 🚀 Deployment Checklist

## ✅ Pre-Deployment

- [x] MongoDB Atlas database created and populated
- [x] All data migrated successfully (34 documents)
- [x] Environment variables configured
- [x] Backend API created with Express.js
- [x] Frontend built with Vite + React
- [ ] Git repository created
- [ ] Code pushed to GitHub/GitLab/Bitbucket

---

## 📦 What's Ready for Deployment

### Backend (server/)
- ✅ Express.js API
- ✅ MongoDB Atlas connection
- ✅ JWT authentication
- ✅ All endpoints implemented
- ✅ CORS configured
- ✅ Environment variables ready
- ✅ Vercel configuration (`vercel.json`)

### Frontend (root)
- ✅ Vite + React application
- ✅ API client configured
- ✅ Authentication context
- ✅ All pages and components
- ✅ Environment variables ready
- ✅ Vercel configuration (`vercel.json`)

### Database
- ✅ MongoDB Atlas (cloud)
- ✅ 13 collections created
- ✅ 34 documents with sample data
- ✅ 44 indexes for performance
- ✅ Connection string ready

---

## 🎯 Deployment Steps

### Step 1: Create Git Repository

```bash
cd copy-of-wokring-yes/copy-of-wokring-yes
git init
git add .
git commit -m "Initial commit - Etiquette LMS"

# Create repository on GitHub, then:
git remote add origin https://github.com/your-username/etiquette-lms.git
git push -u origin main
```

### Step 2: Deploy Backend

1. Go to https://vercel.com/new
2. Import your repository
3. **Root Directory:** `server`
4. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
   JWT_SECRET=etiquette-lms-jwt-secret-key-2026
   ```
5. Deploy
6. **Copy the deployment URL** (e.g., `https://etiquette-lms-api.vercel.app`)

### Step 3: Update Frontend Configuration

Update `.env.production` or Vercel environment variables:
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

### Step 4: Deploy Frontend

1. Go to https://vercel.com/new
2. Import same repository
3. **Root Directory:** `.` (root)
4. **Framework:** Vite
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   VITE_JWT_SECRET=etiquette-lms-jwt-secret-key-2026
   ```
6. Deploy

### Step 5: Update CORS

After frontend deployment, update `server/index.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true
}));
```

Redeploy backend.

---

## 🧪 Testing Deployment

### Test Backend
```bash
# Should return 401 (expected without auth)
curl https://your-backend-url.vercel.app/api/profiles

# Test login
curl -X POST https://your-backend-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"etiqettelms@gmail.com","password":"Akshara@123"}'
```

### Test Frontend
1. Open `https://your-frontend-url.vercel.app`
2. Login with: `etiqettelms@gmail.com` / `Akshara@123`
3. Verify:
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] User data displays
   - [ ] Courses load
   - [ ] Navigation works

---

## 🔒 Security Checklist

- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 for Vercel)
- [ ] Environment variables set in Vercel (not in code)
- [ ] JWT_SECRET is strong and secret
- [ ] CORS configured with specific origins
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] No sensitive data in Git repository

---

## 📊 MongoDB Atlas Configuration

### Allow Vercel Access

1. Go to MongoDB Atlas dashboard
2. Network Access → IP Access List
3. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
   - Or add Vercel's IP ranges
4. Save

### Verify Connection String

```
mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
```

---

## 🎉 Post-Deployment

### Verify Everything Works

- [ ] Backend API responds
- [ ] Frontend loads
- [ ] Login successful
- [ ] Data from MongoDB Atlas loads
- [ ] All pages accessible
- [ ] API calls work
- [ ] No console errors

### Optional: Custom Domain

1. Go to Vercel project settings
2. Domains → Add Domain
3. Follow DNS configuration steps

---

## 📝 Environment Variables Reference

### Backend Environment Variables
```env
MONGODB_URI=mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900
JWT_SECRET=etiquette-lms-jwt-secret-key-2026
PORT=3001
```

### Frontend Environment Variables
```env
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_JWT_SECRET=etiquette-lms-jwt-secret-key-2026
VITE_ENABLE_REMOTE=true
VITE_EMPLOYEE_LOGIN_DOMAIN=employees.local
VITE_PLATFORM_ADMIN_EMAIL=etiqettelms@gmail.com
VITE_PLATFORM_ADMIN_PASSWORD=Akshara@123
```

---

## 🐛 Common Issues

### Issue: API calls fail with CORS error
**Solution:** Update CORS configuration in `server/index.ts` with your frontend URL

### Issue: MongoDB connection timeout
**Solution:** Check MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Issue: 500 Internal Server Error
**Solution:** Check Vercel function logs for detailed error

### Issue: Environment variables not working
**Solution:** Ensure variables are set in Vercel dashboard, not just .env files

---

## 📚 Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Deployment Guide:** See `VERCEL_DEPLOYMENT_GUIDE.md`

---

## ✅ Deployment Complete!

Once all steps are done:

- ✅ Backend deployed to Vercel
- ✅ Frontend deployed to Vercel
- ✅ MongoDB Atlas connected
- ✅ All functionality working
- ✅ HTTPS enabled
- ✅ Ready for production use

**Your Etiquette LMS is live! 🎉**
