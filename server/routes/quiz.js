const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { generatePin } = require('../utils/generatePin');
const router = express.Router();

// Tüm quizleri getir (Ogretmen icin - giris yapmis olmali)
router.get('/my-quizzes', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const [quizzes] = await pool.execute(
      `SELECT q.*, 
        (SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = q.id) as participant_count,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q WHERE q.teacher_id = ? ORDER BY q.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Quiz listesi hatasi:', error);
    res.status(500).json({ success: false, message: 'Quizler getirilirken hata olustu.' });
  }
});

// Quiz bilgisi getir
router.get('/info/:quizId', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const [quizzes] = await pool.execute(
      `SELECT q.*, 
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q WHERE id = ? AND teacher_id = ?`, 
      [req.params.quizId, req.user.id]
    );
    if (quizzes.length === 0) return res.status(404).json({ success: false, message: 'Quiz bulunamadi' });
    res.json({ success: true, quiz: quizzes[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Hata olustu' });
  }
});

// Yeni quiz olustur
router.post('/create', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Quiz basligi zorunludur.' });
    }
    
    let pin = generatePin();
    let exists = true;
    while (exists) {
      const [rows] = await pool.execute('SELECT id FROM quizzes WHERE pin_code = ?', [pin]);
      if (rows.length === 0) exists = false;
      else pin = generatePin();
    }
    
    const [result] = await pool.execute(
      'INSERT INTO quizzes (title, description, pin_code, teacher_id, status) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', pin, req.user.id, 'draft']
    );
    
    res.status(201).json({
      success: true,
      message: 'Quiz olusturuldu.',
      quiz: { id: result.insertId, title, description, pin_code: pin, status: 'draft' }
    });
  } catch (error) {
    console.error('Quiz olusturma hatasi:', error);
    res.status(500).json({ success: false, message: 'Quiz olusturulurken hata olustu.' });
  }
});

// Soru ekle
router.post('/:quizId/questions', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question_text, image_url, option_a, option_b, option_c, option_d, correct_option, time_limit, order_index } = req.body;
    
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ success: false, message: 'Tum soru alanlari zorunludur.' });
    }
    
    const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu quize soru ekleme yetkiniz yok.' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO questions (quiz_id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option, time_limit, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question_text, image_url || null, option_a, option_b, option_c, option_d, correct_option, time_limit || 20, order_index || 0]
    );
    
    res.status(201).json({ success: true, message: 'Soru eklendi.', questionId: result.insertId });
  } catch (error) {
    console.error('Soru ekleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Soru eklenirken hata olustu.' });
  }
});

// Toplu soru ekle (Bulk insert)
router.post('/:quizId/questions/bulk', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Gecerli bir soru listesi gonderilmedi.' });
    }
    
    const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu quize soru ekleme yetkiniz yok.' });
    }
    
    let orderIndex = questions[0].order_index || 0;
    
    // Batch insert using promise.all to be safe with mysql2 prepare statements
    for (const q of questions) {
       await pool.execute(
         `INSERT INTO questions (quiz_id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option, time_limit, order_index) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [quizId, q.question_text, q.image_url || null, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.time_limit || 20, orderIndex]
       );
       orderIndex++;
    }
    
    res.status(201).json({ success: true, message: `${questions.length} soru eklendi.` });
  } catch (error) {
    console.error('Toplu soru ekleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Sorular eklenirken hata olustu.' });
  }
});

// Tüm soruların süresini güncelle
router.put('/:quizId/questions/time-limit', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { time_limit } = req.body;
    
    if (!time_limit || isNaN(time_limit) || time_limit < 5) {
       return res.status(400).json({ success: false, message: 'Gecerli bir sure (en az 5) giriniz.' });
    }

    const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu quizi duzenleme yetkiniz yok.' });
    }

    await pool.execute(
      'UPDATE questions SET time_limit = ? WHERE quiz_id = ?',
      [time_limit, quizId]
    );

    res.json({ success: true, message: 'Tum sorularin suresi guncellendi.' });
  } catch (error) {
    console.error('Sure guncelleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Sureler guncellenirken hata olustu.' });
  }
});

// Soru guncelle
router.put('/:quizId/questions/:questionId', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    const { question_text, image_url, option_a, option_b, option_c, option_d, correct_option, time_limit } = req.body;
    
    // Check if the user owns the quiz
    const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu soruyu duzenleme yetkiniz yok.' });
    }
    
    await pool.execute(
      `UPDATE questions 
       SET question_text = ?, image_url = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, time_limit = ?
       WHERE id = ? AND quiz_id = ?`,
      [question_text, image_url || null, option_a, option_b, option_c, option_d, correct_option, time_limit || 20, questionId, quizId]
    );
    
    res.json({ success: true, message: 'Soru guncellendi.' });
  } catch (error) {
    console.error('Soru guncelleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Soru guncellenirken hata olustu.' });
  }
});

// Soru sil
router.delete('/:quizId/questions/:questionId', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    
    // Yetki kontrolü
    const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu soruyu silme yetkiniz yok.' });
    }
    
    // Önce bu soruya verilmiş cevapları sil
    await pool.execute('DELETE FROM quiz_answers WHERE question_id = ?', [questionId]);
    
    // Sonra soruyu sil
    await pool.execute('DELETE FROM questions WHERE id = ? AND quiz_id = ?', [questionId, quizId]);
    
    res.json({ success: true, message: 'Soru başarıyla silindi.' });
  } catch (error) {
    console.error('Soru silme hatasi:', error);
    res.status(500).json({ success: false, message: 'Soru silinirken hata olustu.' });
  }
});

// Quiz sorularini getir (Ogretmen icin)
router.get('/:quizId/questions', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC',
      [quizId]
    );
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Sorulari getirme hatasi:', error);
    res.status(500).json({ success: false, message: 'Sorular getirilirken hata olustu.' });
  }
});

// Quiz istatistiklerini getir
router.get('/:quizId/stats', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Quiz kontrolü (Öğretmen kendi quizini mi görüyor?)
    const [quizzes] = await pool.execute('SELECT id, title FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, req.user.id]);
    if (quizzes.length === 0) return res.status(404).json({ success: false, message: 'Quiz bulunamadi' });

    const [stats] = await pool.execute(
      `SELECT 
        q.id, 
        q.question_text, 
        q.correct_option,
        q.option_a, q.option_b, q.option_c, q.option_d,
        COUNT(CASE WHEN qa.is_correct = 1 THEN 1 END) as correct_count,
        COUNT(CASE WHEN qa.is_correct = 0 THEN 1 END) as incorrect_count,
        ((SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = q.quiz_id) - COUNT(qa.id)) as empty_count
       FROM questions q
       LEFT JOIN quiz_answers qa ON q.id = qa.question_id
       WHERE q.quiz_id = ?
       GROUP BY q.id
       ORDER BY q.order_index ASC`,
      [quizId]
    );

    res.json({ success: true, stats, quizTitle: quizzes[0].title });
  } catch (error) {
    console.error('Istatistik getirme hatasi:', error);
    res.status(500).json({ success: false, message: 'Istatistikler getirilirken hata olustu.' });
  }
});



// PIN ile quiz kontrol et (Ogrenci - giris yapmamis olabilir)
router.get('/join/:pin', async (req, res) => {
  try {
    const { pin } = req.params;
    const [quizzes] = await pool.execute(
      'SELECT id, title, description, pin_code, status, is_active FROM quizzes WHERE pin_code = ?',
      [pin.toUpperCase()]
    );
    
    if (quizzes.length === 0) {
      return res.status(404).json({ success: false, message: 'Gecersiz PIN kodu.' });
    }
    
    const quiz = quizzes[0];
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('PIN kontrol hatasi:', error);
    res.status(500).json({ success: false, message: 'Quiz bulunurken hata olustu.' });
  }
});

// Liderlik tablosu
router.get('/:quizId/leaderboard', async (req, res) => {
  try {
    const { quizId } = req.params;
    const [participants] = await pool.execute(
      'SELECT nickname, score, correct_answers, total_answers FROM quiz_participants WHERE quiz_id = ? ORDER BY score DESC, correct_answers DESC, nickname ASC',
      [quizId]
    );
    res.json({ success: true, leaderboard: participants });
  } catch (error) {
    console.error('Leaderboard hatasi:', error);
    res.status(500).json({ success: false, message: 'Leaderboard getirilirken hata olustu.' });
  }
});

// Quiz sil
router.delete('/:quizId', verifyToken, requireRole('teacher'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    const [quiz] = await connection.execute(
      'SELECT id FROM quizzes WHERE id = ? AND teacher_id = ?', 
      [quizId, teacherId]
    );
    
    if (quiz.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu quizi silme yetkiniz yok.' });
    }

    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Ilgili tablolardan verileri sil
    await connection.execute(`DELETE qa FROM quiz_answers qa INNER JOIN questions q ON qa.question_id = q.id WHERE q.quiz_id = ?`, [quizId]);
    await connection.execute(`DELETE qa FROM quiz_answers qa INNER JOIN quiz_participants qp ON qa.participant_id = qp.id WHERE qp.quiz_id = ?`, [quizId]);
    await connection.execute('DELETE FROM quiz_participants WHERE quiz_id = ?', [quizId]);
    await connection.execute('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
    await connection.execute('DELETE FROM quizzes WHERE id = ?', [quizId]);

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    res.json({ success: true, message: 'Quiz basariyla silindi.' });
  } catch (error) {
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.error('Quiz silme hatasi:', error);
    res.status(500).json({ success: false, message: 'Quiz silinirken hata olustu.', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
