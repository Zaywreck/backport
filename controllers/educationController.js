const express = require('express');
const db = require('../db');  // Veritabanı bağlantısı

const router = express.Router();

// Eğitim Bilgilerini Listele
router.get('/education', async (req, res) => {
  try {
    const [education] = await db.query('SELECT * FROM education');
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Eğitim Bilgisi Ekle
router.post('/education', async (req, res) => {
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO education (school, degree, field, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [school, degree, field, startDate, endDate, description]
    );
    res.status(201).json({ id: result.insertId, school, degree, field, startDate, endDate, description });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Eğitim Bilgisi Silme
router.delete('/education/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM education WHERE id = ?', [id]);
    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Eğitim Bilgisi Güncelleme
router.put('/education/:id', async (req, res) => {
  const { id } = req.params;
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    await db.query(
      'UPDATE education SET school = ?, degree = ?, field = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?',
      [school, degree, field, startDate, endDate, description, id]
    );
    res.status(200).json({ message: 'Eğitim bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
