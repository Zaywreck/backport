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
      createdAt: new Date().toISOString(),
      userId: req.body.userId || null // Store userId if provided
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

// Update a comment
router.put('/:blogId/comments/:commentId', async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { comment, userId } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === blogId);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Find the comment
    const commentIndex = blogs[blogIndex].comments?.findIndex(c => c.id === commentId);
    if (commentIndex === -1 || commentIndex === undefined) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is the author of the comment (by name or userId)
    const commentAuthor = blogs[blogIndex].comments[commentIndex];
    if (userId && commentAuthor.userId && commentAuthor.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    // Update the comment
    blogs[blogIndex].comments[commentIndex].comment = comment;
    blogs[blogIndex].comments[commentIndex].updatedAt = new Date().toISOString();

    // Update Edge Config
    await patchEdgeConfig('blogs', blogs);

    res.json(blogs[blogIndex].comments[commentIndex]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/:blogId/comments/:commentId', async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { userId } = req.body;

    const blogs = await get('blogs') || [];
    const blogIndex = blogs.findIndex(b => b.id === blogId);
    
    if (blogIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Find the comment
    const commentIndex = blogs[blogIndex].comments?.findIndex(c => c.id === commentId);
    if (commentIndex === -1 || commentIndex === undefined) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is the author of the comment (by name or userId)
    const commentAuthor = blogs[blogIndex].comments[commentIndex];
    if (userId && commentAuthor.userId && commentAuthor.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Remove the comment
    blogs[blogIndex].comments.splice(commentIndex, 1);

    // Update Edge Config
    await patchEdgeConfig('blogs', blogs);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
