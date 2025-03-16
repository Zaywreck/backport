const express = require('express');
const db = require('../db');  // Veritabanı bağlantısı

const router = express.Router();

// Experience - Tüm deneyimleri getirme
router.get('/experiences', async (req, res) => {
  try {
    const [experiences] = await db.query('SELECT * FROM experiences');
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Experience - Yeni deneyim ekleme
router.post('/experiences', async (req, res) => {
  const { title, company, start_date, end_date, description } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO experiences (title, company, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)',
      [title, company, start_date, end_date, description]
    );
    res.status(201).json({ id: result.insertId, title, company, start_date, end_date, description });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Experience - Deneyimi silme
router.delete('/experiences/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM experiences WHERE id = ?', [id]);
    res.status(200).json({ message: 'Deneyim silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Experience - Deneyimi güncelleme
router.put('/experiences/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, start_date, end_date, description } = req.body;

  try {
    await db.query(
      'UPDATE experiences SET title = ?, company = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?',
      [title, company, start_date, end_date, description, id]
    );
    res.status(200).json({ message: 'Deneyim güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
