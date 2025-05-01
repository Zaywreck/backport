import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';

const app = express();

// CORS middleware
app.use(cors());

// JSON verileri almak için middleware
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the API powered by Vercel Edge Config 🚀');
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);

// Sunucu başlatma
const PORT = 3169;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
