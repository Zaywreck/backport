import express from 'express';
import { get } from '@vercel/edge-config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const EDGE_CONFIG_URL = process.env.EDGE_CONFIG_URL;
const API_TOKEN = process.env.EDGE_CONFIG_TOKEN;

// Helper function to get users from Edge Config
async function getUsers() {
  try {
    const users = await get('registeredUsers') || [];
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

// Helper function to update Edge Config - using the same pattern as in adminRoutes.js
async function patchEdgeConfig(key, value) {
  try {
    const response = await fetch(EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key,
            value,
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${result.message || 'Unknown error'}`);
    }
    console.log(`Updated ${key}:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
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
    console.log('Registration attempt:', { email: req.body.email });
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const users = await getUsers();
    console.log(`Retrieved ${Array.isArray(users) ? users.length : 'non-array'} users`);
    
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

    // Create a new array to avoid potential reference issues
    const updatedUsers = Array.isArray(users) ? [...users, newUser] : [newUser];
    console.log(`Updating users array with new user. Total users: ${updatedUsers.length}`);
    
    try {
      // Update the registeredUsers collection in Edge Config
      await patchEdgeConfig('registeredUsers', updatedUsers);
    } catch (updateError) {
      console.error('Failed to update Edge Config:', updateError);
      return res.status(500).json({ message: 'Error saving user to database' });
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    console.log('User login attempt:', { email: req.body.email });
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

    // For regular user login, check that the role is 'user'
    if (user.role !== 'user') {
      return res.status(403).json({ message: 'This login is for regular users only' });
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
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', { email: req.body.email });
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

    // For admin login, check that the role is 'admin'
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
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
    console.error('Admin login error:', error);
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
