const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Ortam degiskenlerini yukle
dotenv.config();

// Route'lari import et
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const boardRoutes = require('./routes/board');
const { setupSocketHandlers } = require('./routes/socketHandlers');

const app = express();
const server = http.createServer(app);

// Socket.io kurulumu
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request loglama
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// API Route'lari
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/board', boardRoutes);

app.use('/uploads', express.static('uploads'));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Dosya yuklenemedi' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, fileUrl });
});

// Socket.io handler'lari kur
setupSocketHandlers(io);

// Ana endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Egitim Platformu API calisiyor.', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadi.' });
});

// Hata handler
app.use((err, req, res, next) => {
  console.error('Sunucu hatasi:', err);
  res.status(500).json({ success: false, message: 'Sunucu hatasi olustu.' });
});

// Sunucuyu baslat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Egitim Platformu Sunucusu calisiyor`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 CORS: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`========================================`);
});

module.exports = { app, io };
