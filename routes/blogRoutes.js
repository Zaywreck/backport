import express from 'express';
import { get } from '@vercel/edge-config';

const router = express.Router();

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogs = await get('blogs') || [];
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const blogs = await get('blogs') || [];
    const blog = blogs.find(b => b.id === req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Add comment to a blog post
router.post('/:id/comments', async (req, res) => {
  try {
    const { name, comment } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: 'Name and comment are required' });
    }

    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === req.params.id);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const newComment = {
      id: Date.now().toString(),
      name,
      comment,
      createdAt: new Date().toISOString()
    };

    blogs[blogIndex].comments = blogs[blogIndex].comments || [];
    blogs[blogIndex].comments.push(newComment);

    // Update Edge Config
    await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogs }),
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Toggle like on a blog post
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === req.params.id);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    blogs[blogIndex].likes = blogs[blogIndex].likes || [];
    const likeIndex = blogs[blogIndex].likes.indexOf(userId);

    if (likeIndex === -1) {
      blogs[blogIndex].likes.push(userId);
    } else {
      blogs[blogIndex].likes.splice(likeIndex, 1);
    }

    // Update Edge Config
    await fetch(process.env.EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogs }),
    });

    res.json({ likes: blogs[blogIndex].likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
