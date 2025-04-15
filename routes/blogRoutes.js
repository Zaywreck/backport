import express from 'express';
import { get } from '@vercel/edge-config';

const EDGE_CONFIG_URL = process.env.EDGE_CONFIG_URL;
const API_TOKEN = process.env.VERCEL_API_TOKEN;

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

    // Update Edge Config using the working patchEdgeConfig function
    await patchEdgeConfig('blogs', blogs);

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Helper function to update Edge Config - using the same pattern that works in other routes
async function patchEdgeConfig(key, value) {
  try {
    const response = await fetch(EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        Authorization: API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key,
            value,
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${result.message || 'Unknown error'}`);
    }
    console.log(`Updated ${key}:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
  }
}

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

    // Update Edge Config using the working patchEdgeConfig function
    await patchEdgeConfig('blogs', blogs);

    res.json({ likes: blogs[blogIndex].likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
