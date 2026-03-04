import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jishnunreddy_db_user:yJDLa5dDrOaXMpGC@cluster900.rtmxg8z.mongodb.net/etiquette_lms?retryWrites=true&w=majority&appName=Cluster900';
const JWT_SECRET = process.env.JWT_SECRET || 'etiquette-lms-jwt-secret-key-2026';

let cachedDb: any = null;

function buildUserIdFilter(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id };
}

async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedDb = client.db();
  console.log('Connected to MongoDB');
  return cachedDb;
}

// Middleware to verify JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await connectDB();
    const { email, password, name, role, department, assignedCourses } = req.body;

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role: role || 'employee',
      department: department || 'Unassigned',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      progress: {},
      assignedCourses: assignedCourses || [],
      xp: 0,
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const profile = { ...newUser, id: result.insertedId.toString(), _id: undefined, password: undefined };

    const token = jwt.sign({ id: result.insertedId.toString(), email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, profile, password: req.body.password });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await connectDB();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Profile Routes
app.get('/api/profiles/me', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await db.collection('users').findOne(buildUserIdFilter(userId));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      progress: user.progress || {},
      assignedCourses: user.assignedCourses || [],
      xp: user.xp || 0
    };

    res.json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/profiles', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection('users').find({}).toArray();
    const profiles = users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      progress: user.progress || {},
      assignedCourses: user.assignedCourses || [],
      xp: user.xp || 0
    }));

    res.json(profiles);
  } catch (error: any) {
    console.error('Get profiles error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/profiles/:id', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates._id;
    delete updates.password;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(id),
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = {
      id: result._id.toString(),
      email: result.email,
      name: result.name,
      role: result.role,
      department: result.department,
      avatar: result.avatar,
      progress: result.progress || {},
      assignedCourses: result.assignedCourses || [],
      xp: result.xp || 0
    };

    res.json(profile);
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// User Management Routes
app.post('/api/users', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    if (req.user.role !== 'platform_admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { email, password, name, role, department, assignedCourses } = req.body;

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role: role || 'employee',
      department: department || 'Unassigned',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      progress: {},
      assignedCourses: assignedCourses || [],
      xp: 0,
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const profile = {
      id: result.insertedId.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      avatar: newUser.avatar,
      progress: newUser.progress,
      assignedCourses: newUser.assignedCourses,
      xp: newUser.xp
    };

    res.status(201).json({ profile, password });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    if (req.user.role !== 'platform_admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates._id;
    delete updates.password;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(id),
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = {
      id: result._id.toString(),
      email: result.email,
      name: result.name,
      role: result.role,
      department: result.department,
      avatar: result.avatar,
      progress: result.progress || {},
      assignedCourses: result.assignedCourses || [],
      xp: result.xp || 0
    };

    res.json(profile);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    if (req.user.role !== 'platform_admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const result = await db.collection('users').deleteOne(buildUserIdFilter(id));

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Progress Routes
app.post('/api/progress/module', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const { courseId, moduleId } = req.body;
    const userId = req.user.id;

    const xpGained = 200;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(userId),
      {
        $set: {
          [`progress.${courseId}.completedModules`]: { $addToSet: moduleId },
          [`progress.${courseId}.lastUpdated`]: new Date().toISOString()
        },
        $inc: { xp: xpGained }
      },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      newXP: result.xp,
      xpGained
    });
  } catch (error: any) {
    console.error('Update module progress error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/progress/complete', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const { courseId, score } = req.body;
    const userId = req.user.id;

    const isPassed = score >= 70;
    const xpGained = isPassed ? 500 : 0;

    const result = await db.collection('users').findOneAndUpdate(
      buildUserIdFilter(userId),
      {
        $set: {
          [`progress.${courseId}.assessmentScore`]: score,
          [`progress.${courseId}.isCompleted`]: isPassed,
          [`progress.${courseId}.completionDate`]: new Date().toISOString(),
          [`progress.${courseId}.lastUpdated`]: new Date().toISOString()
        },
        $inc: { xp: xpGained }
      },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      newXP: result.xp,
      isPassed,
      xpGained
    });
  } catch (error: any) {
    console.error('Submit course completion error:', error);
    res.status(500).json({ message: error.message });
  }
});

// XP Routes
app.post('/api/xp', authenticateToken, async (req: any, res) => {
  try {
    const db = await connectDB();
    const { xp } = req.body;
    const userId = req.user.id;

    await db.collection('users').updateOne(
      buildUserIdFilter(userId),
      { $set: { xp, updatedAt: new Date() } }
    );

    res.json({ success: true, xp });
  } catch (error: any) {
    console.error('Update XP error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Export for Vercel serverless
export default app;

// Start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
