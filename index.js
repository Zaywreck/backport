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

// --- Visitor & Online Counter State (in-memory for demo) ---
let visitorCount = 0;
let recentVisitors = [];

// --- Visitor Middleware ---
app.use((req, res, next) => {
  // Only count page visits (not API calls except /, /api/visitors, /api/online)
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    visitorCount++;
    // Track IP and timestamp for online count
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    recentVisitors.push({ ip, time: Date.now() });
    // Clean up old entries (older than 5 min)
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    recentVisitors = recentVisitors.filter(v => v.time > fiveMinAgo);
  }
  next();
});

// --- Sitemap Endpoint ---
app.get('/sitemap.xml', async (req, res) => {
  // List of static frontend pages
  const pages = [
    '/', '/about', '/projects', '/blog'
  ];
  // Get blog slugs from blogRoutes (simulate: load from JSON/db for now)
  let blogSlugs = [];
  try {
    const blogsPath = path.join(process.cwd(), 'backport', 'blogs.json');
    if (fs.existsSync(blogsPath)) {
      const blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
      blogSlugs = blogs.map(b => `/blog/${b.slug}`);
    }
  } catch (e) { /* ignore */ }
  const urls = [...pages, ...blogSlugs];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>https://${req.headers.host}${u}</loc></url>`).join('\n')}\n</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// --- Visitor Counter Endpoint ---
app.get('/api/visitors', (req, res) => {
  res.json({ visitors: visitorCount });
});

// --- Online User Counter Endpoint ---
app.get('/api/online', (req, res) => {
  // Unique IPs in last 5 min
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recent = recentVisitors.filter(v => v.time > fiveMinAgo);
  const uniqueIPs = new Set(recent.map(v => v.ip));
  res.json({ online: uniqueIPs.size });
});

// --- Gallery Endpoint (static Google Drive links) ---
app.get('/api/gallery', (req, res) => {
  // Replace with your own public Google Drive image links
  const images = [
    'https://drive.google.com/file/d/1nu2u7G8NDK382klluz3XSUMcRrbxxuX7/view?usp=share_link',
    'https://drive.google.com/file/d/1fdKMEu47XZ1cqlVkAzOhcj5BNS4FDpvW/view?usp=share_link',
    'https://drive.google.com/file/d/15k4gcZQ6p9GVEPR0YpdB-IGTztO0cIVK/view?usp=share_link'
  ];
  res.json({ images });
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
