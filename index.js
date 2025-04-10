const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/auth');

const app = express();

// CORS middleware
app.use(cors());

// JSON verileri almak için middleware
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the API powered by Vercel Edge Config 🚀');
});

// serve static files
app.use(express.static('public'));
// Middleware for serving static files
app.use('/public', express.static('public'));
// Middleware for serving pdf files
app.use('/pdf', express.static('pdf'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// Sunucu başlatma
const PORT = 3169;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
