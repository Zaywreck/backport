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
      // Try to get users with the Edge Config compatible key
      const users = await get(EDGE_CONFIG_USER_KEY);
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

// Edge Config key for users (Edge Config doesn't accept 'users' as a property name)
const EDGE_CONFIG_USER_KEY = 'usersList';

// Helper function to update Edge Config
async function updateEdgeConfig(key, value) {
  try {
    // Check if Edge Config environment variables are available
    if (!process.env.EDGE_CONFIG_URL || !process.env.EDGE_CONFIG_TOKEN) {
      console.warn('Edge Config environment variables not set. Using in-memory storage instead.');
      memoryStorage[key] = value;
      return;
    }

    // Create a safe copy of the value to avoid circular reference issues
    const safeValue = JSON.parse(JSON.stringify(value));
    const requestBody = { [key]: safeValue };
    
    console.log(`Attempting to update Edge Config for key: ${key}`);
    
    try {
      const response = await fetch(process.env.EDGE_CONFIG_URL, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => 'No response text');
        console.warn(`Failed to update Edge Config: ${response.status} ${response.statusText}`);
        console.warn(`Response body: ${responseText}`);
        console.warn(`Request body was: ${JSON.stringify(requestBody)}`);
        
        // Fallback to in-memory storage
        console.log('Using in-memory storage fallback');
        memoryStorage[key] = value;
      } else {
        console.log(`Successfully updated Edge Config for key: ${key}`);
      }
    } catch (fetchError) {
      console.error('Edge Config fetch error:', fetchError);
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
      // Use the Edge Config compatible key
      await updateEdgeConfig(EDGE_CONFIG_USER_KEY, updatedUsers);
    } catch (updateError) {
      console.error('Failed to update Edge Config:', updateError);
      // Even if Edge Config update fails, we'll still return success
      // since the user is stored in memory
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
