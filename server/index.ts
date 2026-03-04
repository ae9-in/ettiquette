import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  authMiddlewareFactory,
} from './middleware/authMiddleware.ts';
import type { AuthenticatedRequest } from './middleware/authMiddleware.ts';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = Number(process.env.PORT || 3001);

// FIX: Startup logs show env/config health without printing secrets.
console.log('[startup] Environment loaded');
console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
console.log(`[startup] PORT=${PORT}`);
console.log(`[startup] MONGO_URI loaded=${Boolean(MONGO_URI)}`);
console.log(`[startup] JWT_SECRET loaded=${Boolean(JWT_SECRET)}`);

const authenticateToken = authMiddlewareFactory(JWT_SECRET);
const ALLOWED_ROLES = new Set(['employee', 'hr', 'platform_admin']);

let cachedDb: any = null;
let cachedClient: MongoClient | null = null;
const CONFIG_ERROR = !MONGO_URI
  ? 'Missing required env var: MONGO_URI'
  : !JWT_SECRET
    ? 'Missing required env var: JWT_SECRET'
    : null;

function sendError(
  res: Response,
  status: number,
  message: string,
  details?: string | Record<string, any>
) {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

function buildUserIdFilter(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id };
}

function toPublicProfile(user: any) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
    progress: user.progress || {},
    assignedCourses: user.assignedCourses || [],
    xp: user.xp || 0,
  };
}

function signAuthToken(user: { userId: string; role: string }) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }
  // FIX: Unified JWT payload + expiry.
  return jwt.sign(
    { userId: user.userId, role: user.role },
    JWT_SECRET as string,
    { expiresIn: '1d' }
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing');
  }

  if (cachedDb) {
    return cachedDb;
  }

  cachedClient = new MongoClient(MONGO_URI as string);
  await cachedClient.connect();
  cachedDb = cachedClient.db();
  // FIX: explicit connection status log.
  console.log('[startup] Connected to MongoDB Atlas');
  return cachedDb;
}

function ensureServerConfig(res: Response) {
  if (CONFIG_ERROR) {
    // FIX: Return structured config errors instead of crashing function invocation.
    return sendError(res, 500, 'Server configuration error', CONFIG_ERROR);
  }
  return null;
}

app.use((req, _res, next) => {
  // FIX: Backward-compatible aliases so /auth/* works as /api/auth/*.
  const aliasPrefixes = ['/auth/', '/profiles', '/users', '/progress', '/xp', '/health'];
  if (!req.url.startsWith('/api/') && aliasPrefixes.some((p) => req.url.startsWith(p))) {
    req.url = `/api${req.url}`;
  }
  next();
});

app.get('/api/health', async (_req, res) => {
  if (CONFIG_ERROR) {
    return sendError(res, 500, 'Server configuration error', CONFIG_ERROR);
  }
  return res.json({ success: true, message: 'API is healthy' });
});

// Auth Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { email, password, name, role, department, assignedCourses } = req.body || {};

    if (!email || !password || !name) {
      return sendError(res, 400, 'email, password and name are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return sendError(res, 400, 'Invalid email format');
    }

    if (String(password).length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    const normalizedRole = role ? String(role).trim() : 'employee';
    if (!ALLOWED_ROLES.has(normalizedRole)) {
      return sendError(res, 400, 'Invalid role');
    }

    const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newUser = {
      email: normalizedEmail,
      password: hashedPassword,
      name: String(name).trim(),
      role: normalizedRole,
      department: department ? String(department).trim() : 'Unassigned',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(name))}&backgroundColor=b6e3f4`,
      progress: {},
      assignedCourses: Array.isArray(assignedCourses) ? assignedCourses : [],
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();
    const token = signAuthToken({ userId, role: newUser.role });
    const profile = toPublicProfile({ ...newUser, _id: result.insertedId });

    return res.status(201).json({
      success: true,
      token,
      profile,
      user: { userId: profile.id, role: profile.role },
    });
  } catch (error: any) {
    console.error('[auth/register] error:', error?.message || error);
    return sendError(res, 500, 'Failed to register user');
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { email, password } = req.body || {};

    if (!email || !password) {
      return sendError(res, 400, 'email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db.collection('users').findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(String(password), user.password || '');
    if (!isValidPassword) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return res.json({
      success: true,
      token,
      user: { userId: user._id.toString(), role: user.role },
    });
  } catch (error: any) {
    console.error('[auth/login] error:', error?.message || error);
    return sendError(res, 500, 'Failed to login');
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }

    const user = await db.collection('users').findOne(buildUserIdFilter(userId));
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return res.json({
      success: true,
      user: toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('[auth/me] error:', error?.message || error);
    return sendError(res, 500, 'Failed to fetch current user');
  }
});

// Profile Routes
app.get('/api/profiles/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }

    const user = await db.collection('users').findOne(buildUserIdFilter(userId));
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return res.json(toPublicProfile(user));
  } catch (error: any) {
    console.error('[profiles/me] error:', error?.message || error);
    return sendError(res, 500, 'Failed to fetch profile');
  }
});

app.get('/api/profiles', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const users = await db.collection('users').find({}).toArray();
    const profiles = users.map((user: any) => toPublicProfile(user));
    return res.json(profiles);
  } catch (error: any) {
    console.error('[profiles] error:', error?.message || error);
    return sendError(res, 500, 'Failed to fetch profiles');
  }
});

app.put('/api/profiles/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { id } = req.params;
    const updates = { ...(req.body || {}) };

    delete updates.id;
    delete updates._id;
    delete updates.password;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(id),
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return sendError(res, 404, 'User not found');
    }

    return res.json(toPublicProfile(result));
  } catch (error: any) {
    console.error('[profiles/:id] error:', error?.message || error);
    return sendError(res, 500, 'Failed to update profile');
  }
});

// User Management Routes
app.post('/api/users', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'hr') {
      return sendError(res, 403, 'Unauthorized');
    }

    const { email, password, name, role, department, assignedCourses } = req.body || {};
    if (!email || !password || !name) {
      return sendError(res, 400, 'email, password and name are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return sendError(res, 400, 'Invalid email format');
    }

    if (String(password).length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    const normalizedRole = role ? String(role).trim() : 'employee';
    if (!ALLOWED_ROLES.has(normalizedRole)) {
      return sendError(res, 400, 'Invalid role');
    }

    const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newUser = {
      email: normalizedEmail,
      password: hashedPassword,
      name: String(name).trim(),
      role: normalizedRole,
      department: department ? String(department).trim() : 'Unassigned',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(name))}&backgroundColor=b6e3f4`,
      progress: {},
      assignedCourses: Array.isArray(assignedCourses) ? assignedCourses : [],
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    const profile = toPublicProfile({ ...newUser, _id: result.insertedId });

    return res.status(201).json({
      success: true,
      profile,
      password: String(password),
    });
  } catch (error: any) {
    console.error('[users/create] error:', error?.message || error);
    return sendError(res, 500, 'Failed to create user');
  }
});

app.put('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'hr') {
      return sendError(res, 403, 'Unauthorized');
    }

    const { id } = req.params;
    const updates = { ...(req.body || {}) };

    delete updates.id;
    delete updates._id;
    delete updates.password;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(id),
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return sendError(res, 404, 'User not found');
    }

    return res.json(toPublicProfile(result));
  } catch (error: any) {
    console.error('[users/update] error:', error?.message || error);
    return sendError(res, 500, 'Failed to update user');
  }
});

app.delete('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'hr') {
      return sendError(res, 403, 'Unauthorized');
    }

    const { id } = req.params;
    const result = await db.collection('users').deleteOne(buildUserIdFilter(id));

    if (result.deletedCount === 0) {
      return sendError(res, 404, 'User not found');
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('[users/delete] error:', error?.message || error);
    return sendError(res, 500, 'Failed to delete user');
  }
});

// Progress Routes
app.post('/api/progress/module', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { courseId, moduleId } = req.body || {};
    const userId = req.user?.userId;

    if (!courseId || !moduleId) {
      return sendError(res, 400, 'courseId and moduleId are required');
    }
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }

    const xpGained = 200;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(userId),
      {
        // FIX: $addToSet must be top-level, not nested in $set.
        $addToSet: { [`progress.${courseId}.completedModules`]: moduleId },
        $set: {
          [`progress.${courseId}.courseId`]: courseId,
          [`progress.${courseId}.lastUpdated`]: new Date().toISOString(),
          updatedAt: new Date(),
        },
        $inc: { xp: xpGained },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return sendError(res, 404, 'User not found');
    }

    return res.json({
      success: true,
      newXP: result.xp || 0,
      xpGained,
    });
  } catch (error: any) {
    console.error('[progress/module] error:', error?.message || error);
    return sendError(res, 500, 'Failed to update module progress');
  }
});

app.post('/api/progress/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { courseId, score } = req.body || {};
    const userId = req.user?.userId;

    if (!courseId || typeof score !== 'number') {
      return sendError(res, 400, 'courseId and numeric score are required');
    }
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }

    const isPassed = score >= 70;
    const xpGained = isPassed ? 500 : 0;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(userId),
      {
        $set: {
          [`progress.${courseId}.courseId`]: courseId,
          [`progress.${courseId}.assessmentScore`]: score,
          [`progress.${courseId}.isCompleted`]: isPassed,
          [`progress.${courseId}.completionDate`]: new Date().toISOString(),
          [`progress.${courseId}.lastUpdated`]: new Date().toISOString(),
          updatedAt: new Date(),
        },
        $inc: { xp: xpGained },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return sendError(res, 404, 'User not found');
    }

    return res.json({
      success: true,
      newXP: result.xp || 0,
      isPassed,
      xpGained,
    });
  } catch (error: any) {
    console.error('[progress/complete] error:', error?.message || error);
    return sendError(res, 500, 'Failed to submit course completion');
  }
});

// XP Routes
app.post('/api/xp', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configErr = ensureServerConfig(res);
    if (configErr) return configErr;

    const db = await connectDB();
    const { xp } = req.body || {};
    const userId = req.user?.userId;

    if (typeof xp !== 'number') {
      return sendError(res, 400, 'xp must be a number');
    }
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }

    const result = await db.collection('users').updateOne(
      buildUserIdFilter(userId),
      { $set: { xp, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return sendError(res, 404, 'User not found');
    }

    return res.json({ success: true, xp });
  } catch (error: any) {
    console.error('[xp/update] error:', error?.message || error);
    return sendError(res, 500, 'Failed to update XP');
  }
});

app.use((_req, res) => sendError(res, 404, 'Route not found'));

// Export for Vercel serverless
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
