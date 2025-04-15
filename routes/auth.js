import express from 'express';
import { get } from '@vercel/edge-config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper function to get users from Edge Config or fallback storage
async function getUsers() {
  try {
    // Check if Edge Config environment variables are available
    if (!process.env.EDGE_CONFIG_URL || !process.env.EDGE_CONFIG_TOKEN) {
      console.warn('Edge Config environment variables not set. Using in-memory storage instead.');
      return memoryStorage.users || [];
    }

    try {
      const users = await get('users');
      // Ensure users is always an array
      return Array.isArray(users) ? users : memoryStorage.users || [];
    } catch (edgeConfigError) {
      console.warn('Error getting users from Edge Config:', edgeConfigError);
      // Fallback to in-memory storage
      return memoryStorage.users || [];
    }
  } catch (error) {
    console.error('Error in getUsers function:', error);
    return [];
  }
}

// In-memory fallback storage when Edge Config is unavailable
const memoryStorage = {
  users: []
};

// Helper function to update Edge Config
async function updateEdgeConfig(key, value) {
  try {
    // Check if Edge Config environment variables are available
    if (!process.env.EDGE_CONFIG_URL || !process.env.EDGE_CONFIG_TOKEN) {
      console.warn('Edge Config environment variables not set. Using in-memory storage instead.');
      memoryStorage[key] = value;
      return;
    }

    const response = await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    });

    if (!response.ok) {
      console.warn(`Failed to update Edge Config: ${response.status} ${response.statusText}`);
      // Fallback to in-memory storage
      memoryStorage[key] = value;
    }
  } catch (error) {
    console.error('Edge Config update error:', error);
    // Fallback to in-memory storage
    memoryStorage[key] = value;
  }
}
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const users = await getUsers();
    // Check if email already exists, using a safer approach
    const emailExists = Array.isArray(users) && users.some(user => user && user.email === email);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await updateEdgeConfig('users', users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = await getUsers();
    // Ensure users is an array before using find
    const user = Array.isArray(users) ? users.find(u => u && u.email === email) : null;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const users = await getUsers();
    // Ensure users is an array before using find
    const user = Array.isArray(users) ? users.find(u => u && u.id === req.user.userId) : null;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update user profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const users = await getUsers();
    // Ensure users is an array before using findIndex
    const userIndex = Array.isArray(users) ? users.findIndex(u => u && u.id === req.user.userId) : -1;

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[userIndex];

    if (name) {
      user.name = name;
    }

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    users[userIndex] = user;
    await updateEdgeConfig('users', users);

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

export default router;
