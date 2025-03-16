const express = require("express");
const db = require("../db"); // Veritabanı bağlantısı

const router = express.Router();

// Kullanıcı Girişi
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return res.status(400).json({ message: "E-posta ve şifre gereklidir" });
  }

  try {
    // Kullanıcıyı veritabanından bul
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0]; // İlk sonucu al

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Şifreyi kontrol et (düz metin karşılaştırması)
    if (user.password !== password) {
      return res.status(401).json({ message: "Geçersiz e-posta veya şifre" });
    }

    // Başarılı giriş yanıtı
    res.status(200).json({ message: "Giriş başarılı" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

module.exports = router;
