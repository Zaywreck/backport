const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// CORS middleware to allow cross-origin requests 
app.use(cors());

// JSON verileri almak için middleware
app.use(express.json());
// welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});
// Routes
// app.use('/api/auth', authRoutes); // auth rotalarını '/auth' ile ilişkilendiriyoruz
app.use('/api/admin', adminRoutes);  // Admin API'lerini buraya yönlendir

// Sunucu başlatma
const PORT = 3169;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
