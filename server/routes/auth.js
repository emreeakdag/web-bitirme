const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

const SSO_HANDOFF_SECRET = process.env.SSO_HANDOFF_SECRET || process.env.JWT_SECRET || 'vibe-learn-sso-secret';
const SSO_FALLBACK_SECRETS = [
  process.env.SSO_HANDOFF_SECRET,
  process.env.JWT_SECRET,
  'vibe-learn-sso-secret',
].filter(Boolean);

const buildSsoEmail = (externalId) => `sso-odevportali-${String(externalId).trim()}@local`;

const normalizeSsoRole = (role) => (String(role).toLowerCase() === 'teacher' ? 'teacher' : 'student');

async function upsertSsoUser({ externalId, fullName, role }) {
  const email = buildSsoEmail(externalId);
  const normalizedRole = normalizeSsoRole(role);
  const [existing] = await pool.execute(
    'SELECT id, full_name, email, role FROM users WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    const user = existing[0];
    if (user.full_name !== fullName || user.role !== normalizedRole) {
      await pool.execute(
        'UPDATE users SET full_name = ?, role = ? WHERE email = ?',
        [fullName, normalizedRole, email]
      );
    }
    return { ...user, full_name: fullName, role: normalizedRole, email };
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, normalizedRole]
  );

  return {
    id: result.insertId,
    full_name: fullName,
    email,
    role: normalizedRole
  };
}

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

router.post('/sso', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'SSO token zorunludur.' });
    }

    let decoded = null;
    let lastError = null;
    for (const secret of SSO_FALLBACK_SECRETS) {
      try {
        decoded = jwt.verify(token, secret, {
          issuer: 'odevportali',
          audience: 'vibe-learn',
        });
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!decoded) {
      const message =
        lastError?.name === 'TokenExpiredError'
          ? 'SSO token süresi dolmuş.'
          : lastError?.message === 'invalid signature'
            ? 'SSO token imzası doğrulanamadı.'
            : 'SSO token doğrulanamadı.';
      return res.status(401).json({ success: false, message });
    }

    if (decoded.source !== 'odevportali' || !decoded.externalId || !decoded.ad_soyad) {
      return res.status(401).json({ success: false, message: 'Gecersiz SSO tokeni.' });
    }

    const user = await upsertSsoUser({
      externalId: decoded.externalId,
      fullName: decoded.ad_soyad,
      role: decoded.role,
    });

    const appUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };
    const appToken = generateToken(appUser);

    res.json({
      success: true,
      message: 'SSO girisi basarili.',
      token: appToken,
      user: appUser
    });
  } catch (error) {
    console.error('SSO hatasi:', error);
    res.status(401).json({ success: false, message: error?.message || 'SSO girişi doğrulanamadı.' });
  }
});

module.exports = router;
