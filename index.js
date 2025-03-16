const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Genel middleware örneği
app.use((req, res, next) => {
  console.log('Middleware çalıştı');
  next();
});

// CORS middleware
app.use(cors());

// JSON verileri almak için middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // auth rotalarını '/auth' ile ilişkilendiriyoruz
app.use('/api/admin', adminRoutes);  // Admin API'lerini buraya yönlendir

// Sunucu başlatma
const PORT = 3169;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
