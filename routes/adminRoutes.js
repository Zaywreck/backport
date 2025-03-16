const express = require('express');
const db = require('../db');  // Veritabanı bağlantısı

const router = express.Router();

// ===================== Experience =====================

// User Bilgilerini Listele
router.get('/user', async (req, res) => {
  try {
    const [user] = await db.query('SELECT * FROM users');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ', error });
  }
});

// Experience Bilgilerini Listele
router.get('/experience', async (req, res) => {
  try {
    const [experiences] = await db.query('SELECT * FROM experiencess');
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error });
  }
});

// Yeni Experience Bilgisi Ekle
router.post('/experience', async (req, res) => {
  const { title, company, startDate, endDate, description } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO experiencess (title, company, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)',
      [title, company, startDate, endDate, description]
    );
    res.status(201).json({ id: result.insertId, title, company, startDate, endDate, description });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası:  ' + error });
    console.log(error);
  }
});

// Experience Bilgisi Silme
router.delete('/experience/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM experiencess WHERE id = ?', [id]);
    res.status(200).json({ message: 'Deneyim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Experience Bilgisi Güncelleme
router.put('/experience/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, startDate, endDate, description } = req.body;

  try {
    await db.query(
      'UPDATE experiencess SET title = ?, company = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?',
      [title, company, startDate, endDate, description, id]
    );
    res.status(200).json({ message: 'Deneyim bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===================== Education =====================

// Education Bilgilerini Listele
router.get('/education', async (req, res) => {
  try {
    const [education] = await db.query('SELECT * FROM educationn');
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Education Bilgisi Ekle
router.post('/education', async (req, res) => {
  const { school, degree, field, start_date, end_date, description } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO educationn (school, degree, field, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [school, degree, field, start_date, end_date, description]
    );
    res.status(201).json({ id: result.insertId, school, degree, field, start_date, end_date, description });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' + error });
  }
});

// Education Bilgisi Silme
router.delete('/education/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM educationn WHERE id = ?', [id]);
    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Education Bilgisi Güncelleme
router.put('/education/:id', async (req, res) => {
  const { id } = req.params;
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    await db.query(
      'UPDATE educationn SET school = ?, degree = ?, field = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?',
      [school, degree, field, startDate, endDate, description, id]
    );
    res.status(200).json({ message: 'Eğitim bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===================== Projects =====================

// Projects Bilgilerini Listele
router.get('/projects', async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projectss');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Project Bilgisi Ekle
router.post('/projects', async (req, res) => {
  const { title, description, image_url, project_url } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO projectss (title, description, image_url, project_url) VALUES (?, ?, ?, ?)',
      [title, description, image_url, project_url]
    );
    res.status(201).json({ id: result.insertId, title, description, image_url, project_url });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Project Bilgisi Silme
router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM projectss WHERE id = ?', [id]);
    res.status(200).json({ message: 'Proje bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Project Bilgisi Güncelleme
router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, project_url } = req.body;

  try {
    await db.query(
      'UPDATE projectss SET title = ?, description = ?, image_url = ?, project_url = ? WHERE id = ?',
      [title, description, image_url, project_url, id]
    );
    res.status(200).json({ message: 'Proje bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
