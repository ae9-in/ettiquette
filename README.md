<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Etiquette LMS - MongoDB Edition

This is a Learning Management System built with React, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)

### Installation

**Automated Setup (Windows):**
```bash
start.bat
```

**Automated Setup (macOS/Linux):**
```bash
chmod +x start.sh
./start.sh
```

Or manually:

1. **Install MongoDB**
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux/Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

2. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Seed Database with Sample Data**
   ```bash
   cd server
   npm run seed
   cd ..
   ```
   This creates 6 users, 12 courses, activity logs, achievements, and more!

4. **Start Application**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - **Admin Login:** `etiqettelms@gmail.com` / `Akshara@123`
   - **Employee Login:** `john.doe@company.com` / `employee123`

## 📚 Documentation

- [Quick Start Guide](QUICKSTART.md) - Get up and running fast
- [Migration Guide](MONGODB_MIGRATION.md) - Detailed migration documentation
- [Migration Summary](MIGRATION_SUMMARY.md) - Overview of changes
- [Database Seeded](DATABASE_SEEDED.md) - Sample data and test accounts
- [Setup Checklist](SETUP_CHECKLIST.md) - Step-by-step verification

## 🔄 What Changed?

This project was migrated from Supabase to MongoDB:

- ✅ Replaced Supabase with MongoDB
- ✅ Replaced Supabase Auth with JWT authentication
- ✅ Removed Google OAuth (now email/password)
- ✅ Created Express.js backend API
- ✅ All data stored in MongoDB

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS (via inline styles)

**Backend:**
- Express.js
- MongoDB
- JWT Authentication
- bcrypt for password hashing

## 📁 Project Structure

```
copy-of-wokring-yes/
├── server/              # Backend API
│   ├── index.ts        # Express server
│   ├── create-admin.ts # Admin user creation script
│   └── package.json    # Backend dependencies
├── systems/            # Data layer
│   ├── api.ts         # API client
│   ├── mongodb.ts     # MongoDB connection
│   └── appData.mongodb.ts # Data operations
├── contexts/          # React contexts
│   └── AuthContext.tsx # Authentication
├── pages/             # React pages
├── components/        # React components
└── data/             # Course data

```

## 🔐 Environment Variables

**.env.local** (Frontend):
```env
VITE_MONGODB_URI=mongodb://localhost:27017/etiquette_lms
VITE_API_URL=http://localhost:3001/api
VITE_JWT_SECRET=your-secret-key-change-in-production
```

**server/.env** (Backend):
```env
MONGODB_URI=mongodb://localhost:27017/etiquette_lms
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

## 🎯 Features

- User authentication with JWT
- Role-based access control (Platform Admin, HR, Employee)
- Course management and assignment
- Progress tracking
- Assessment system
- XP and gamification
- Admin dashboard for user management

## 🐛 Troubleshooting

**MongoDB not running?**
```bash
mongosh --eval "db.adminCommand('ping')"
```

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001
```

**Can't login?**
Make sure you created the admin user:
```bash
cd server
npm run create-admin
```

## 📝 API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/profiles/me` - Get current user
- `GET /api/profiles` - Get all users
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `POST /api/progress/module` - Update module progress
- `POST /api/progress/complete` - Submit course completion
- `POST /api/xp` - Update XP

## 🚀 Production Deployment

1. Use MongoDB Atlas or hosted MongoDB
2. Set strong JWT_SECRET
3. Enable HTTPS
4. Configure CORS
5. Add rate limiting
6. Set up monitoring

## 📄 License

This project is for educational purposes.

## 🤝 Support

For issues or questions, refer to the documentation files in this repository.

## Fixing 404 on Refresh (Vercel + React Router)

This app uses `BrowserRouter`, so routes like `/login` and `/dashboard` are client-side routes.
On direct open or browser refresh, Vercel must serve the SPA entry (`/`) instead of looking for a physical file at that path.

Updated `vercel.json` rewrites:
- Keep backend endpoints working: `/api/(.*) -> /api/$1`
- Send all other paths to the SPA entry: `/(.*) -> /`

Required Vercel project settings:
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `copy-of-wokring-yes/copy-of-wokring-yes` (if your repo deploy root is the top-level folder)
