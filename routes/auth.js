const express = require('express');
const router = express.Router();

const { get } = require('@vercel/edge-config');


router.use(express.json()); // JSON parse

async function getUser() {
  const users = await get('users') || {};
  console.log('Kullanıcı bilgileri:', users);
  return users;
}

// OPTIONS request handler for preflight
router.options('/login', (req, res) => {
  res.sendStatus(200);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-posta ve şifre gereklidir' });
  }

  try {
    const user = await getUser();

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }
    res.status(200).json({ message: 'Giriş başarılı' });
  } catch (error) {
    console.log('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;
