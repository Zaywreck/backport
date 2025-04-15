import express from 'express';
import { get } from '@vercel/edge-config';
import isAdmin from '../middleware/adminAuth.js';

const router = express.Router();

// Create new blog post
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, content, summary } = req.body;
    if (!title || !content || !summary) {
      return res.status(400).json({ error: 'Title, content, and summary are required' });
    }

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      summary,
      createdAt: new Date().toISOString(),
      comments: [],
      likes: []
    };

    const blogs = await get('blogs') || [];
    blogs.push(newPost);

    // Update Edge Config
    await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogs }),
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Update blog post
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { title, content, summary } = req.body;
    if (!title || !content || !summary) {
      return res.status(400).json({ error: 'Title, content, and summary are required' });
    }

    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === req.params.id);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    blogs[blogIndex] = {
      ...blogs[blogIndex],
      title,
      content,
      summary,
      updatedAt: new Date().toISOString()
    };

    // Update Edge Config
    await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogs }),
    });

    res.json(blogs[blogIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === req.params.id);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    blogs.splice(blogIndex, 1);

    // Update Edge Config
    await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogs }),
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

export default router;
