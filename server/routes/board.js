const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { generateBoardCode } = require('../utils/generatePin');
const router = express.Router();

// ==============================
// PUBLIC ROUTES (ANONYMOUS/NICKNAME)
// ==============================

// Kod ile pano bul (Ogrenci katilmadan once - Public)
router.get('/join-public/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const [boards] = await pool.execute(
      `SELECT b.*, u.full_name as teacher_name 
       FROM boards b JOIN users u ON b.teacher_id = u.id 
       WHERE b.code = ? AND b.is_active = TRUE`,
      [code.toUpperCase()]
    );
    
    if (boards.length === 0) {
      return res.status(404).json({ success: false, message: 'Pano bulunamadi veya pasif.' });
    }
    
    res.json({ success: true, board: boards[0] });
  } catch (error) {
    console.error('Public pano bulma hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano aranirken hata olustu.' });
  }
});

// Pano detaylari ve postlari getir (Public)
router.get('/public/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params; console.log('PUT /board/', boardId, req.body);
    const { nickname } = req.query; // Send nickname to track likes if needed
    
    const [board] = await pool.execute(
      `SELECT b.*, u.full_name as teacher_name 
       FROM boards b JOIN users u ON b.teacher_id = u.id 
       WHERE b.id = ?`,
      [boardId]
    );
    
    if (board.length === 0) {
      return res.status(404).json({ success: false, message: 'Pano bulunamadi.' });
    }
    
    if (!board[0].is_active) {
      return res.status(403).json({ success: false, message: 'Bu pano ögretmen tarafindan kapatilmistir.' });
    }
    
    // Postlari getir - user_id opsiyonel
    const [posts] = await pool.execute(
      `SELECT bp.*, 
        COALESCE(u.full_name, bp.guest_nickname) as author_name, 
        u.email as author_email,
        (SELECT COUNT(*) FROM board_likes WHERE post_id = bp.id) as likes
       FROM board_posts bp
       LEFT JOIN users u ON bp.user_id = u.id
       WHERE bp.board_id = ?
       ORDER BY bp.created_at DESC`,
      [boardId]
    );
    
    // Kullanicinin begendigi postlari isaretle
    let likedPostIds = [];
    if (nickname) {
       const [userLikes] = await pool.execute(
         'SELECT post_id FROM board_likes WHERE guest_nickname = ?',
         [nickname]
       );
       likedPostIds = userLikes.map(l => l.post_id);
    }
    
    const postsWithLikeInfo = posts.map(p => ({
      ...p,
      is_liked: likedPostIds.includes(p.id)
    }));
    
    res.json({
      success: true,
      board: board[0],
      posts: postsWithLikeInfo,
      myRole: 'guest'
    });
  } catch (error) {
    console.error('Public pano detay hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano detaylari getirilirken hata olustu.' });
  }
});

// Post ekle (Public)
router.post('/public/:boardId/posts', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { content, file_url, file_type, cover_image_url, attachments, nickname } = req.body;
    
    if (!content || content.trim().length === 0 || !nickname) {
      return res.status(400).json({ success: false, message: 'Icerik ve nickname zorunludur.' });
    }
    
    const [board] = await pool.execute('SELECT allow_posts, is_active FROM boards WHERE id = ?', [boardId]);
    if (board.length === 0 || !board[0].is_active) return res.status(403).json({ success: false, message: 'Pano kapali.' });
    if (!board[0].allow_posts) return res.status(403).json({ success: false, message: 'Bu panoda su an paylasim yapilamaz.' });
    
    const [result] = await pool.execute(
      'INSERT INTO board_posts (board_id, user_id, guest_nickname, content, file_url, file_type, cover_image_url, attachments) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)',
      [boardId, nickname, content, file_url || null, file_type || 'none', cover_image_url || null, attachments ? JSON.stringify(attachments) : null]
    );
    
    // Yeni postu don
    const [newPost] = await pool.execute(
      `SELECT bp.*, bp.guest_nickname as author_name, NULL as author_email, 0 as likes
       FROM board_posts bp
       WHERE bp.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({ success: true, message: 'Post eklendi.', post: newPost[0] });
  } catch (error) {
    console.error('Public post ekleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post eklenirken hata olustu.' });
  }
});

// Begeni toggle (Public)
router.post('/public/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { nickname } = req.body;
    
    if (!nickname) return res.status(400).json({ success: false, message: 'Nickname zorunlu' });

    const [existing] = await pool.execute(
      'SELECT id FROM board_likes WHERE post_id = ? AND guest_nickname = ?',
      [postId, nickname]
    );
    
    if (existing.length > 0) {
      await pool.execute('DELETE FROM board_likes WHERE post_id = ? AND guest_nickname = ?', [postId, nickname]);
    } else {
      await pool.execute('INSERT INTO board_likes (post_id, guest_nickname) VALUES (?, ?)', [postId, nickname]);
    }
    
    const [count] = await pool.execute(
      'SELECT COUNT(*) as likes FROM board_likes WHERE post_id = ?',
      [postId]
    );
    
    res.json({ success: true, liked: existing.length === 0, likes: count[0].likes });
  } catch (error) {
    console.error('Public begeni hatasi:', error);
    res.status(500).json({ success: false, message: 'Islem sirasinda hata olustu.' });
  }
});

// Post sil (Public)
router.delete('/public/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { nickname } = req.body; 
    
    const [post] = await pool.execute('SELECT guest_nickname FROM board_posts WHERE id = ?', [postId]);
    if (post.length === 0) {
      return res.status(404).json({ success: false, message: 'Post bulunamadi.' });
    }
    
    if (post[0].guest_nickname !== nickname) {
      return res.status(403).json({ success: false, message: 'Bu postu silme yetkiniz yok.' });
    }
    
    await pool.execute('DELETE FROM board_posts WHERE id = ?', [postId]);
    res.json({ success: true, message: 'Post silindi.' });
  } catch (error) {
    console.error('Public post silme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post silinirken hata olustu.' });
  }
});

// Post guncelle (Public)
router.put('/public/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, file_url, file_type, cover_image_url, attachments, nickname } = req.body;
    
    const [post] = await pool.execute('SELECT guest_nickname FROM board_posts WHERE id = ?', [postId]);
    if (post.length === 0) return res.status(404).json({ success: false, message: 'Post bulunamadi.' });
    if (post[0].guest_nickname !== nickname) return res.status(403).json({ success: false, message: 'Yetkiniz yok.' });
    
    await pool.execute(
      'UPDATE board_posts SET content = ?, file_url = ?, file_type = ?, cover_image_url = ?, attachments = ? WHERE id = ?',
      [content, file_url || null, file_type || 'none', cover_image_url || null, attachments ? JSON.stringify(attachments) : null, postId]
    );
    
    const [updatedPost] = await pool.execute(
      `SELECT bp.*, bp.guest_nickname as author_name, NULL as author_email,
        (SELECT COUNT(*) FROM board_likes WHERE post_id = bp.id) as likes
       FROM board_posts bp
       WHERE bp.id = ?`,
      [postId]
    );
    
    res.json({ success: true, message: 'Post guncellendi.', post: updatedPost[0] });
  } catch (error) {
    console.error('Public post guncelleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post guncellenirken hata olustu.' });
  }
});

// ==============================
// PROTECTED ROUTES (LOGGED IN)
// ==============================

// Yeni pano olustur (Ogretmen)
router.post('/create', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, bg_image } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Pano basligi zorunludur.' });
    }
    
    let code = generateBoardCode();
    let exists = true;
    while (exists) {
      const [rows] = await pool.execute('SELECT id FROM boards WHERE code = ?', [code]);
      if (rows.length === 0) exists = false;
      else code = generateBoardCode();
    }
    
    const [result] = await pool.execute(
      'INSERT INTO boards (title, description, code, teacher_id, bg_image) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', code, req.user.id, bg_image || 'default']
    );
    
    // Olusturan ogretmeni owner olarak ekle
    await pool.execute(
      'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'owner']
    );
    
    res.status(201).json({
      success: true,
      message: 'Pano olusturuldu.',
      board: { id: result.insertId, title, description, code, bg_image: bg_image || 'default' }
    });
  } catch (error) {
    console.error('Pano olusturma hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano olusturulurken hata olustu.' });
  }
});

// Ogretmenin panolarini getir
router.get('/my-boards', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const [boards] = await pool.execute(
      `SELECT b.*, 
        (SELECT COUNT(*) FROM board_posts WHERE board_id = b.id) as post_count,
        (SELECT COUNT(*) FROM board_members WHERE board_id = b.id) as member_count
       FROM boards b WHERE b.teacher_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, boards });
  } catch (error) {
    console.error('Pano listesi hatasi:', error);
    res.status(500).json({ success: false, message: 'Panolar getirilirken hata olustu.' });
  }
});

// Ogrencinin katildigi panolari getir
router.get('/joined-boards', verifyToken, async (req, res) => {
  try {
    const [boards] = await pool.execute(
      `SELECT b.*, u.full_name as teacher_name,
        (SELECT COUNT(*) FROM board_posts WHERE board_id = b.id) as post_count
       FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       JOIN users u ON b.teacher_id = u.id
       WHERE bm.user_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, boards });
  } catch (error) {
    console.error('Katilim panolari hatasi:', error);
    res.status(500).json({ success: false, message: 'Panolar getirilirken hata olustu.' });
  }
});

// Kod ile pano bul (Ogrenci katilmadan once)
router.get('/find/:code', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    const [boards] = await pool.execute(
      `SELECT b.*, u.full_name as teacher_name 
       FROM boards b JOIN users u ON b.teacher_id = u.id 
       WHERE b.code = ? AND b.is_active = TRUE`,
      [code.toUpperCase()]
    );
    
    if (boards.length === 0) {
      return res.status(404).json({ success: false, message: 'Pano bulunamadi veya pasif.' });
    }
    
    const board = boards[0];
    
    // Kullanici zaten uye mi kontrol et
    const [membership] = await pool.execute(
      'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
      [board.id, req.user.id]
    );
    
    board.is_member = membership.length > 0;
    
    res.json({ success: true, board });
  } catch (error) {
    console.error('Pano bulma hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano aranirken hata olustu.' });
  }
});

// Panoya katil
router.post('/:boardId/join', verifyToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const [board] = await pool.execute('SELECT id FROM boards WHERE id = ?', [boardId]);
    if (board.length === 0) {
      return res.status(404).json({ success: false, message: 'Pano bulunamadi.' });
    }
    
    const [existing] = await pool.execute(
      'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, req.user.id]
    );
    
    if (existing.length > 0) {
      return res.json({ success: true, message: 'Zaten bu panonun uyesisiniz.' });
    }
    
    await pool.execute(
      'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
      [boardId, req.user.id, 'member']
    );
    
    res.json({ success: true, message: 'Panoya basariyla katildiniz.' });
  } catch (error) {
    console.error('Panoya katilma hatasi:', error);
    res.status(500).json({ success: false, message: 'Panoya katilirken hata olustu.' });
  }
});

// Pano detaylari ve postlari getir
router.get('/:boardId', verifyToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    
    // Uyelik kontrolu
    const [membership] = await pool.execute(
      'SELECT role FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, req.user.id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu panoya erisim yetkiniz yok. Once panoya katilin.' });
    }
    
    const [board] = await pool.execute(
      `SELECT b.*, u.full_name as teacher_name 
       FROM boards b JOIN users u ON b.teacher_id = u.id 
       WHERE b.id = ?`,
      [boardId]
    );
    
    if (board.length === 0) {
      return res.status(404).json({ success: false, message: 'Pano bulunamadi.' });
    }
    
    if (!board[0].is_active && board[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu pano ögretmen tarafindan kapatilmistir.' });
    }
    
    // Postlari getir - Kullanici bilgisi JOIN ile cekiliyor (MySQL'den ad net gorunmeli)
    const [posts] = await pool.execute(
      `SELECT bp.*, 
        COALESCE(u.full_name, bp.guest_nickname) as author_name, 
        u.email as author_email,
        (SELECT COUNT(*) FROM board_likes WHERE post_id = bp.id) as likes
       FROM board_posts bp
       LEFT JOIN users u ON bp.user_id = u.id
       WHERE bp.board_id = ?
       ORDER BY bp.created_at DESC`,
      [boardId]
    );
    
    // Kullanicinin begendigi postlari isaretle
    const [userLikes] = await pool.execute(
      'SELECT post_id FROM board_likes WHERE user_id = ?',
      [req.user.id]
    );
    const likedPostIds = userLikes.map(l => l.post_id);
    
    const postsWithLikeInfo = posts.map(p => ({
      ...p,
      is_liked: likedPostIds.includes(p.id)
    }));
    
    // Uyeleri getir
    const [members] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.role, bm.role as member_role, bm.joined_at
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = ?`,
      [boardId]
    );
    
    res.json({
      success: true,
      board: board[0],
      posts: postsWithLikeInfo,
      members,
      myRole: membership[0].role
    });
  } catch (error) {
    console.error('Pano detay hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano detaylari getirilirken hata olustu.' });
  }
});

// Post ekle
router.post('/:boardId/posts', verifyToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { content, file_url, file_type, cover_image_url, attachments } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Icerik zorunludur.' });
    }
    
    // Uyelik kontrolu
    const [membership] = await pool.execute(
      'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, req.user.id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu panoya post ekleme yetkiniz yok.' });
    }
    
    const [board] = await pool.execute('SELECT allow_posts, is_active, teacher_id FROM boards WHERE id = ?', [boardId]);
    if (board.length === 0 || (!board[0].is_active && board[0].teacher_id !== req.user.id)) return res.status(403).json({ success: false, message: 'Pano kapali.' });
    if (!board[0].allow_posts && board[0].teacher_id !== req.user.id) return res.status(403).json({ success: false, message: 'Bu panoda paylasim kapali.' });
    
    const [result] = await pool.execute(
      'INSERT INTO board_posts (board_id, user_id, content, file_url, file_type, cover_image_url, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [boardId, req.user.id, content, file_url || null, file_type || 'none', cover_image_url || null, attachments ? JSON.stringify(attachments) : null]
    );
    
    // Yeni postu kullanici bilgisiyle birlikte don
    const [newPost] = await pool.execute(
      `SELECT bp.*, u.full_name as author_name, u.email as author_email, 0 as likes
       FROM board_posts bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({ success: true, message: 'Post eklendi.', post: newPost[0] });
  } catch (error) {
    console.error('Post ekleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post eklenirken hata olustu.' });
  }
});

// Begeni toggle
router.post('/posts/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [postInfo] = await pool.execute(
      `SELECT b.teacher_id, b.allow_posts, b.is_active 
       FROM board_posts bp 
       JOIN boards b ON bp.board_id = b.id 
       WHERE bp.id = ?`, [postId]
    );
    if (postInfo.length === 0) return res.status(404).json({ success: false, message: 'Post bulunamadi.' });
    
    if (!postInfo[0].is_active && postInfo[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Pano kapali.' });
    }
    if (!postInfo[0].allow_posts && postInfo[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu panoda paylasim kapali.' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM board_likes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.id]
    );
    
    if (existing.length > 0) {
      await pool.execute('DELETE FROM board_likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);
    } else {
      await pool.execute('INSERT INTO board_likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
    }
    
    const [count] = await pool.execute(
      'SELECT COUNT(*) as likes FROM board_likes WHERE post_id = ?',
      [postId]
    );
    
    res.json({ success: true, liked: existing.length === 0, likes: count[0].likes });
  } catch (error) {
    console.error('Begeni hatasi:', error);
    res.status(500).json({ success: false, message: 'Islem sirasinda hata olustu.' });
  }
});

// Post sil
router.delete('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [post] = await pool.execute(
      `SELECT bp.user_id, bp.board_id, b.teacher_id, b.allow_posts, b.is_active 
       FROM board_posts bp 
       JOIN boards b ON bp.board_id = b.id 
       WHERE bp.id = ?`, [postId]
    );
    if (post.length === 0) {
      return res.status(404).json({ success: false, message: 'Post bulunamadi.' });
    }
    
    const isOwner = post[0].user_id === req.user.id;
    const isTeacher = post[0].teacher_id === req.user.id;
    
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Bu postu silme yetkiniz yok.' });
    }
    
    if (!post[0].is_active && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Pano kapali.' });
    }
    if (!post[0].allow_posts && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Bu panoda paylasim kapali.' });
    }
    
    await pool.execute('DELETE FROM board_posts WHERE id = ?', [postId]);
    res.json({ success: true, message: 'Post silindi.' });
  } catch (error) {
    console.error('Post silme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post silinirken hata olustu.' });
  }
});

// Pano duzenle
router.put('/:boardId', verifyToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, is_active, allow_posts, bg_image } = req.body;
    
    const [board] = await pool.execute('SELECT teacher_id, title FROM boards WHERE id = ?', [boardId]);
    if (board.length === 0) return res.status(404).json({ success: false, message: 'Pano bulunamadi.' });
    
    if (board[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu panoyu duzenleme yetkiniz yok.' });
    }
    
    const fields = [];
    const values = [];
    
    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    
    if (req.body.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(req.body.is_active);
    }
    if (req.body.allow_posts !== undefined) {
      fields.push('allow_posts = ?');
      values.push(req.body.allow_posts);
    }
    if (req.body.bg_image !== undefined) {
      fields.push('bg_image = ?');
      values.push(req.body.bg_image);
    }
    
    values.push(boardId);
    
    await pool.execute(
      `UPDATE boards SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    // Değişiklikleri odaya anında bildir
    const io = req.app.get('io');
    if (io) {
      const [updatedBoard] = await pool.execute(
        'SELECT title, description, is_active, allow_posts, bg_image FROM boards WHERE id = ?', 
        [boardId]
      );
      if (updatedBoard.length > 0) {
        io.to(`board_${boardId}`).emit('board-updated', updatedBoard[0]);
      }
    }
    
    res.json({ success: true, message: 'Pano guncellendi.' });
  } catch (error) {
    console.error('Pano duzenleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Pano guncellenirken hata olustu.' });
  }
});

// Post duzenle
router.put('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, file_url, file_type, cover_image_url, attachments } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Icerik zorunludur.' });
    }
    
    const [post] = await pool.execute(
      `SELECT bp.user_id, bp.board_id, b.teacher_id, b.allow_posts, b.is_active 
       FROM board_posts bp 
       JOIN boards b ON bp.board_id = b.id 
       WHERE bp.id = ?`, [postId]
    );
    if (post.length === 0) {
      return res.status(404).json({ success: false, message: 'Post bulunamadi.' });
    }
    
    if (post[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu postu duzenleme yetkiniz yok.' });
    }
    
    if (!post[0].is_active && post[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Pano kapali.' });
    }
    if (!post[0].allow_posts && post[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu panoda paylasim kapali.' });
    }
    
    await pool.execute(
      'UPDATE board_posts SET content = ?, file_url = ?, file_type = ?, cover_image_url = ?, attachments = ? WHERE id = ?',
      [content, file_url || null, file_type || 'none', cover_image_url || null, attachments ? JSON.stringify(attachments) : null, postId]
    );
    
    const [updatedPost] = await pool.execute(
      `SELECT bp.*, u.full_name as author_name, u.email as author_email,
        (SELECT COUNT(*) FROM board_likes WHERE post_id = bp.id) as likes
       FROM board_posts bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.id = ?`,
      [postId]
    );
    
    res.json({ success: true, message: 'Post guncellendi.', post: updatedPost[0] });
  } catch (error) {
    console.error('Post duzenleme hatasi:', error);
    res.status(500).json({ success: false, message: 'Post guncellenirken hata olustu.' });
  }
});

module.exports = router;
