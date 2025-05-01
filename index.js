import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';
import fs from 'fs';
import path from 'path';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import slugify from 'slugify';
import { patchEdgeConfig, getEdgeConfig } from './utils/edgeConfig.js';

const app = express();

// --- CSRF Protection Setup ---
app.use(cookieParser());
const csrfProtection = csurf({ cookie: true });

// CORS middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// JSON verileri almak için middleware
app.use(express.json());

// --- Persistent Visitor & Online Counter with Edge Config ---
// No in-memory state. All data is stored in Edge Config.

// Increment visitor count and return value
app.post('/api/visitors/increment', async (req, res) => {
  try {
    let stats = (await getEdgeConfig('stats')) || {};
    stats.visitors = (parseInt(stats.visitors) || 0) + 1;
    await patchEdgeConfig('stats', stats);
    res.json({ visitors: stats.visitors });
  } catch (e) {
    console.error('Error incrementing visitors:', e);
    res.status(500).json({ error: 'Failed to increment visitors' });
  }
});

// Get visitor count
app.get('/api/visitors', async (req, res) => {
  try {
    let stats = (await getEdgeConfig('stats')) || {};
    res.json({ visitors: parseInt(stats.visitors) || 0 });
  } catch (e) {
    console.error('Error getting visitors:', e);
    res.status(500).json({ error: 'Failed to get visitors' });
  }
});

// Online user ping (add a timestamp to the online array)
app.post('/api/online/ping', async (req, res) => {
  try {
    let stats = (await getEdgeConfig('stats')) || {};
    let online = stats.online || [];
    const now = Date.now();
    online.push({ time: now });
    // Keep only last 5 min
    online = online.filter(v => v.time > now - 5 * 60 * 1000);
    stats.online = online;
    await patchEdgeConfig('stats', stats);
    res.json({ online: online.length });
  } catch (e) {
    console.error('Error updating online users:', e);
    res.status(500).json({ error: 'Failed to update online users' });
  }
});

// Get online user count
app.get('/api/online', async (req, res) => {
  try {
    let stats = (await getEdgeConfig('stats')) || {};
    let online = stats.online || [];
    const now = Date.now();
    online = online.filter(v => v.time > now - 5 * 60 * 1000);
    res.json({ online: online.length });
  } catch (e) {
    console.error('Error getting online users:', e);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});



// --- Sitemap Endpoint ---
app.get('/sitemap.xml', async (req, res) => {
  // List of static frontend pages
  const pages = [
    '/', '/about', '/projects', '/blog'
  ];
  // Get blog slugs from Edge Config
  let blogSlugs = [];
  try {
    const blogs = (await getEdgeConfig('blogs')) || [];
    blogSlugs = blogs.map(b => `/blog/${b.slug || b.id}`);
  } catch (e) { 
    console.error('Error fetching blogs for sitemap:', e);
  }
  const urls = [...pages, ...blogSlugs];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>https://${req.headers.host}${u}</loc></url>`).join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// --- CSRF Token Endpoint ---
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  // Send token as JSON for frontend use
  res.json({ csrfToken: req.csrfToken() });
});

// --- Sample POST route with CSRF protection (for demo) ---
app.post('/api/demo-form', csrfProtection, (req, res) => {
  // Just echo back for demo
  res.json({ ok: true, data: req.body });
});

// --- Slugify Example for Blog Creation ---
// (In real use, integrate this logic in your blog creation route)
function createSlug(title) {
  return slugify(title, { lower: true, strict: true, locale: 'tr' });
}

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
