const express = require('express');
const router = express.Router();

const { get } = require('@vercel/edge-config');
let userEmail = "";
let userPassword = "";
async function getUser() {
  const users = await get('users') || {};
  userEmail = users.email || "";
  userPassword = users.password || "";
  console.log('Kullanıcı bilgileri:', users);
  return users;
}

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
    console.log('Giriş yapan kullanıcı:', user.email);
    console.log('Giriş yapan kullanıcı şfire:', user.password);
    // Başarılı giriş işlemi
    res.status(200).json({ message: 'Giriş başarılı' });
  } catch (error) {
    console.log('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;
