const express = require('express');
const db = require('../db');  // Veritabanı bağlantısı

const router = express.Router();

// Projeleri Listele
router.get('/projects', async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projects');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Proje Ekle
router.post('/projects', async (req, res) => {
  const { title, description, image_url, project_url } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO projects (title, description, image_url, project_url) VALUES (?, ?, ?, ?)',
      [title, description, image_url, project_url]
    );
    res.status(201).json({ id: result.insertId, title, description, image_url, project_url });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje Silme
router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM projects WHERE id = ?', [id]);
    res.status(200).json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje Güncelleme
router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, project_url } = req.body;

  try {
    await db.query(
      'UPDATE projects SET title = ?, description = ?, image_url = ?, project_url = ? WHERE id = ?',
      [title, description, image_url, project_url, id]
    );
    res.status(200).json({ message: 'Proje güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
