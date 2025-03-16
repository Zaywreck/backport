const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// CORS middleware to allow cross-origin requests 
// add preflight request for login
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http:88.231.66.159"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// JSON verileri almak için middleware
app.use(express.json());
// welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});
// Routes
app.use('/api/auth', authRoutes); // auth rotalarını '/auth' ile ilişkilendiriyoruz
app.use('/api/admin', adminRoutes);  // Admin API'lerini buraya yönlendir

// Sunucu başlatma
const PORT = 3169;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
