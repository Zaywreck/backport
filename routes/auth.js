const express = require('express');
const router = express.Router();

const { get } = require('@vercel/edge-config');

async function getUserByEmail(email) {
  const users = await get('users') || [];
  return users.find(user => user.email === email);
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-posta ve şifre gereklidir' });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }

    // Başarılı giriş işlemi
    res.status(200).json({ message: 'Giriş başarılı' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;
