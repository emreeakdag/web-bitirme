const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Kayit olma (Register)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tum alanlar zorunludur.' });
    }
    
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Bu email adresi zaten kayitli.' });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role === 'teacher' ? 'teacher' : 'student';
    
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name, email, password_hash, userRole]
    );
    
    const user = { id: result.insertId, full_name, email, role: userRole };
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Kayit basarili.',
      token,
      user
    });
  } catch (error) {
    console.error('Register hatasi:', error);
    res.status(500).json({ success: false, message: 'Kayit sirasinda bir hata olustu.' });
  }
});

// Giris yapma (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ve sifre zorunludur.' });
    }
    
    const [users] = await pool.execute(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Gecersiz email veya sifre.' });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Gecersiz email veya sifre.' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Giris basarili.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login hatasi:', error);
    res.status(500).json({ success: false, message: 'Giris sirasinda bir hata olustu.' });
  }
});

module.exports = router;
