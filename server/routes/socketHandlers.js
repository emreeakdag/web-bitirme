const pool = require('../config/db');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket baglandi: ${socket.id}`);

    const emitCurrentQuizState = async (targetSocket, quizId) => {
      const [quizzes] = await pool.execute(
        'SELECT status, current_question_index FROM quizzes WHERE id = ?',
        [quizId]
      );

      if (quizzes.length === 0) return;

      const quiz = quizzes[0];

      if (quiz.status === 'completed') {
        const [leaderboard] = await pool.execute(
          'SELECT nickname, score, correct_answers, total_answers FROM quiz_participants WHERE quiz_id = ? ORDER BY score DESC, correct_answers DESC, nickname ASC LIMIT 15',
          [quizId]
        );
        targetSocket.emit('quiz-ended', { leaderboard });
        return;
      }

      if (quiz.status !== 'active') return;

      const [totalRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM questions WHERE quiz_id = ?',
        [quizId]
      );

      const [questionRows] = await pool.execute(
        'SELECT * FROM questions WHERE quiz_id = ? AND order_index = ?',
        [quizId, quiz.current_question_index || 0]
      );

      let question = questionRows[0];
      if (!question) {
        const [fallbackRows] = await pool.execute(
          'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC LIMIT 1',
          [quizId]
        );
        question = fallbackRows[0];
      }

      if (!question) return;

      const orderIndex = question.order_index || 0;
      targetSocket.emit(orderIndex === 0 ? 'quiz-started' : 'new-question', {
        totalQuestions: totalRows[0].total,
        question: {
          id: question.id,
          text: question.question_text,
          image_url: question.image_url,
          options: {
            A: question.option_a,
            B: question.option_b,
            C: question.option_c,
            D: question.option_d
          },
          timeLimit: question.time_limit,
          orderIndex
        }
      });
    };

    // ============================================
    // QUIZ (Yarismaya) EVENTLERI
    // ============================================

    socket.on('host-join-quiz', async ({ quizId }) => {
      try {
        const room = `quiz_${quizId}`;
        socket.join(room);
        socket.quizId = quizId;
        await emitCurrentQuizState(socket, quizId);
      } catch (error) {
        console.error('host-join-quiz senkron hatasi:', error);
      }
    });

    socket.on('join-quiz', async ({ pin, nickname, quizId, userId }) => {
      try {
        const room = `quiz_${quizId}`;
        socket.join(room);
        socket.nickname = nickname;
        socket.quizId = quizId;
        socket.userId = userId || null;

        // Katilimciyi kaydet veya guncelle
        const existingQuery = userId
          ? 'SELECT id FROM quiz_participants WHERE quiz_id = ? AND user_id = ?'
          : 'SELECT id FROM quiz_participants WHERE quiz_id = ? AND nickname = ?';
        const existingParams = userId ? [quizId, userId] : [quizId, nickname];
        const [existing] = await pool.execute(existingQuery, existingParams);

        if (existing.length > 0) {
          await pool.execute(
            'UPDATE quiz_participants SET socket_id = ?, is_active = TRUE, left_at = NULL, nickname = COALESCE(?, nickname), user_id = COALESCE(?, user_id) WHERE id = ?',
            [socket.id, nickname, userId || null, existing[0].id]
          );
        } else {
          if (userId) {
            await pool.execute(
              'INSERT INTO quiz_participants (quiz_id, user_id, nickname, socket_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
              [quizId, userId, nickname, socket.id]
            );
          } else {
            await pool.execute(
              'INSERT INTO quiz_participants (quiz_id, nickname, socket_id, is_active) VALUES (?, ?, ?, TRUE)',
              [quizId, nickname, socket.id]
            );
          }
        }

        // Oda bilgilerini guncelle
        const [participants] = await pool.execute(
          'SELECT id, nickname, score FROM quiz_participants WHERE quiz_id = ? AND is_active = TRUE',
          [quizId]
        );

        socket.to(room).emit('player-joined', { nickname, totalPlayers: participants.length });
        socket.emit('joined-success', { quizId, nickname, totalPlayers: participants.length });
        await emitCurrentQuizState(socket, quizId);

        console.log(`${nickname} katildi: ${pin}`);
      } catch (error) {
        console.error('join-quiz hatasi:', error);
        socket.emit('error', { message: 'Yarismaya katilirken hata olustu.' });
      }
    });
    socket.on('start-quiz', async ({ quizId }) => {
      try {
        const [questions] = await pool.execute(
          'SELECT COUNT(*) as total FROM questions WHERE quiz_id = ?',
          [quizId]
        );
        const totalQuestions = questions[0].total;

        const [quizStatus] = await pool.execute('SELECT status FROM quizzes WHERE id = ?', [quizId]);
        if (quizStatus.length > 0 && quizStatus[0].status === 'completed') {
          socket.emit('error', { message: 'Bu yarisma zaten tamamlanmis. Tekrar baslatilamaz.' });
          return;
        }

        await pool.execute('UPDATE quizzes SET status = ?, is_active = ? WHERE id = ?', ['active', true, quizId]);
        const room = `quiz_${quizId}`;

        // Ilk soruyu getir
        const [firstQuestion] = await pool.execute(
          'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC LIMIT 1',
          [quizId]
        );

        if (firstQuestion.length > 0) {
          const question = firstQuestion[0];
          await pool.execute('UPDATE quizzes SET current_question_index = ? WHERE id = ?', [0, quizId]);

          io.to(room).emit('quiz-started', {
            totalQuestions,
            question: {
              id: question.id,
              text: question.question_text,
              image_url: question.image_url,
              options: {
                A: question.option_a,
                B: question.option_b,
                C: question.option_c,
                D: question.option_d
              },
              timeLimit: question.time_limit,
              orderIndex: 0
            }
          });
        }
      } catch (error) {
        console.error('start-quiz hatasi:', error);
      }
    });

    socket.on('next-question', async ({ quizId, currentIndex }) => {
      try {
        const nextIndex = currentIndex + 1;
        const [questions] = await pool.execute(
          'SELECT * FROM questions WHERE quiz_id = ? AND order_index = ?',
          [quizId, nextIndex]
        );

        const room = `quiz_${quizId}`;

        const [totalRows] = await pool.execute(
          'SELECT COUNT(*) as total FROM questions WHERE quiz_id = ?',
          [quizId]
        );
        const totalQuestions = totalRows[0].total;

        if (questions.length === 0) {
          // Soru kalmadi, yarismayi bitir
          await pool.execute('UPDATE quizzes SET status = ?, is_active = ? WHERE id = ?', ['completed', false, quizId]);

          const [leaderboard] = await pool.execute(
            'SELECT nickname, score, correct_answers, total_answers FROM quiz_participants WHERE quiz_id = ? ORDER BY score DESC, correct_answers DESC, nickname ASC LIMIT 15',
            [quizId]
          );

          io.to(room).emit('quiz-ended', { leaderboard });
        } else {
          const question = questions[0];
          await pool.execute('UPDATE quizzes SET current_question_index = ? WHERE id = ?', [nextIndex, quizId]);

          io.to(room).emit('new-question', {
            totalQuestions,
            question: {
              id: question.id,
              text: question.question_text,
              image_url: question.image_url,
              options: {
                A: question.option_a,
                B: question.option_b,
                C: question.option_c,
                D: question.option_d
              },
              timeLimit: question.time_limit,
              orderIndex: nextIndex
            }
          });
        }
      } catch (error) {
        console.error('next-question hatasi:', error);
      }
    });

    socket.on('submit-answer', async ({ quizId, questionId, selectedOption, timeTaken }) => {
      try {
        if (!socket.quizId || socket.quizId != quizId) return;

        const [questions] = await pool.execute(
          'SELECT correct_option, points FROM questions WHERE id = ?',
          [questionId]
        );

        if (questions.length === 0) return;

        const correctOption = questions[0].correct_option;
        const isCorrect = selectedOption === correctOption;

        // Hizli cevap = daha fazla puan
        const basePoints = questions[0].points || 100;
        const speedBonus = Math.max(0, Math.floor((1 - timeTaken / 20) * 50));
        const pointsEarned = isCorrect ? basePoints + speedBonus : 0;

        const [participants] = await pool.execute(
          'SELECT id, score, correct_answers, total_answers, streak FROM quiz_participants WHERE quiz_id = ? AND socket_id = ?',
          [quizId, socket.id]
        );

        if (participants.length > 0) {
          const p = participants[0];
          const newStreak = isCorrect ? p.streak + 1 : 0;
          const streakBonus = newStreak > 2 ? newStreak * 10 : 0;
          const finalPoints = pointsEarned + streakBonus;

          await pool.execute(
            `UPDATE quiz_participants 
             SET score = score + ?, correct_answers = correct_answers + ?, total_answers = total_answers + 1, streak = ?
             WHERE id = ?`,
            [finalPoints, isCorrect ? 1 : 0, newStreak, p.id]
          );

          await pool.execute(
            'INSERT INTO quiz_answers (participant_id, question_id, selected_option, is_correct, time_taken, points_earned) VALUES (?, ?, ?, ?, ?, ?)',
            [p.id, questionId, selectedOption, isCorrect, timeTaken, finalPoints]
          );

          socket.emit('answer-result', {
            isCorrect,
            correctOption,
            pointsEarned: finalPoints,
            totalScore: p.score + finalPoints,
            streak: newStreak
          });
        }
      } catch (error) {
        console.error('submit-answer hatasi:', error);
      }
    });

    socket.on('question-ended', async ({ quizId }) => {
      try {
        // Liderlik tablosunu guncelle ve yayinla
        const [leaderboard] = await pool.execute(
          'SELECT nickname, score, correct_answers, total_answers FROM quiz_participants WHERE quiz_id = ? ORDER BY score DESC, correct_answers DESC, nickname ASC LIMIT 15',
          [quizId]
        );

        const room = `quiz_${quizId}`;
        io.to(room).emit('leaderboard-update', { leaderboard });
      } catch (error) {
        console.error('question-ended hatasi:', error);
      }
    });

    socket.on('end-quiz', async ({ quizId }) => {
      try {
        await pool.execute('UPDATE quizzes SET status = ?, is_active = ? WHERE id = ?', ['completed', false, quizId]);

        const [leaderboard] = await pool.execute(
          'SELECT nickname, score, correct_answers, total_answers FROM quiz_participants WHERE quiz_id = ? ORDER BY score DESC, correct_answers DESC, nickname ASC LIMIT 15',
          [quizId]
        );

        const room = `quiz_${quizId}`;
        io.to(room).emit('quiz-ended', { leaderboard });
      } catch (error) {
        console.error('end-quiz hatasi:', error);
      }
    });

    // ============================================
    // BOARD (Pano) EVENTLERI
    // ============================================

    socket.on('join-board', ({ boardId, nickname }) => {
      const room = `board_${boardId}`;
      socket.join(room);
      socket.boardId = boardId;
      socket.nickname = nickname || 'Anonim';
      console.log(`Socket ${socket.id} panoya katildi: board_${boardId} as ${socket.nickname}`);

      const activeUsers = Array.from(io.sockets.adapter.rooms.get(room) || []).map(id => {
        return io.sockets.sockets.get(id).nickname || 'Anonim';
      });
      io.to(room).emit('active-users-updated', activeUsers);
    });

    socket.on('leave-board', ({ boardId }) => {
      const room = `board_${boardId}`;
      socket.leave(room);
      socket.boardId = null;
      
      const roomSet = io.sockets.adapter.rooms.get(room);
      const activeUsers = roomSet ? Array.from(roomSet).map(id => {
        return io.sockets.sockets.get(id).nickname || 'Anonim';
      }) : [];
      io.to(room).emit('active-users-updated', activeUsers);
    });

    socket.on('new-board-post', ({ boardId, post }) => {
      const room = `board_${boardId}`;
      socket.to(room).emit('post-added', post);
    });

    socket.on('board-post-liked', ({ boardId, postId, likes, likedBy }) => {
      const room = `board_${boardId}`;
      io.to(room).emit('post-like-updated', { postId, likes, likedBy });
    });

    socket.on('board-post-deleted', ({ boardId, postId }) => {
      const room = `board_${boardId}`;
      io.to(room).emit('post-removed', { postId });
    });

    socket.on('board-post-updated', ({ boardId, post }) => {
      const room = `board_${boardId}`;
      socket.to(room).emit('post-updated', post);
    });

    socket.on('board-settings-updated', ({ boardId, title, description, is_active, allow_posts, bg_image }) => {
      const room = `board_${boardId}`;
      socket.to(room).emit('board-updated', { title, description, is_active, allow_posts, bg_image });
    });

    // ============================================
    // BAGLANTI KESILDI
    // ============================================

    socket.on('disconnect', async () => {
      console.log(`Socket ayrildi: ${socket.id}`);

      if (socket.quizId) {
        await pool.execute(
          'UPDATE quiz_participants SET is_active = FALSE, left_at = NOW() WHERE quiz_id = ? AND socket_id = ?',
          [socket.quizId, socket.id]
        );
      }

      if (socket.boardId) {
        const room = `board_${socket.boardId}`;
        const roomSet = io.sockets.adapter.rooms.get(room);
        const activeUsers = roomSet ? Array.from(roomSet).map(id => {
          return io.sockets.sockets.get(id).nickname || 'Anonim';
        }) : [];
        io.to(room).emit('active-users-updated', activeUsers);
      }
    });
  });
}

module.exports = { setupSocketHandlers };
