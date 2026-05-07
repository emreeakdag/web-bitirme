import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket, joinQuizRoom, leaveQuizRoom } from '../../lib/socket';

const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};

export default function PlayQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isHost = new URLSearchParams(window.location.search).get('host') === 'true';

  const [nickname] = useState(() => sessionStorage.getItem('quiz_nickname') || 'Misafir');
  const [pin] = useState(() => sessionStorage.getItem('quiz_pin') || '');

  const [status, setStatus] = useState('waiting'); // waiting, playing, answered, ended
  const [question, setQuestion] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [prevLeaderboard, setPrevLeaderboard] = useState([]);
  const [error, setError] = useState('');

  const audioRef = useRef(new Audio());
  const leaderboardRef = useRef([]);

  const playSound = (type) => {
    if (SOUNDS[type]) {
      audioRef.current.src = SOUNDS[type];
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  useEffect(() => {
    if (!pin || !nickname) {
      navigate('/join-quiz');
      return;
    }

    const socket = joinQuizRoom(quizId, pin, nickname, {
      onJoined: (data) => {
        console.log('Yarismaya katildiniz:', data);
      },
      onQuizStarted: (data) => {
        setStatus('playing');
        setQuestion(data.question);
        setTotalQuestions(data.totalQuestions || 0);
        setTimeLeft(data.question.timeLimit);
        setSelectedOption(null);
        setAnswerResult(null);
        setLeaderboard([]);
      },
      onNewQuestion: (data) => {
        setStatus('playing');
        setQuestion(data.question);
        setTotalQuestions(data.totalQuestions || totalQuestions);
        setTimeLeft(data.question.timeLimit);
        setSelectedOption(null);
        setAnswerResult(null);
      },
      onAnswerResult: (result) => {
        setAnswerResult(result);
        if (result.isCorrect) {
          playSound('correct');
        } else {
          playSound('wrong');
        }
      },
      onLeaderboard: (data) => {
        if (data && data.leaderboard) {
          setPrevLeaderboard(leaderboardRef.current);
          setLeaderboard(data.leaderboard);
          const me = data.leaderboard.find(p => p.nickname === nickname);
          if (me) {
            setTotalScore(me.score);
          }
        }
      },
      onQuizEnded: (data) => {
        setStatus('ended');
        if (data && data.leaderboard) setLeaderboard(data.leaderboard);
      },
      onError: (err) => {
        setError(err?.message || 'Bir hata olustu.');
        if (err?.message?.includes('tamamlanmis')) {
          setTimeout(() => navigate('/'), 3000);
        }
      }
    }, isHost);

    return () => {
      leaveQuizRoom(quizId);
      socket.off('joined-success');
      socket.off('quiz-started');
      socket.off('new-question');
      socket.off('answer-result');
      socket.off('leaderboard-update');
      socket.off('quiz-ended');
      socket.off('error');
    };
  }, [quizId, pin, nickname, navigate, isHost, totalQuestions]);

  const submitAnswer = useCallback((option, timeTaken) => {
    if (selectedOption || status !== 'playing') return;

    playSound('click');
    setSelectedOption(option);
    const s = getSocket();
    s.emit('submit-answer', {
      quizId,
      questionId: question?.id,
      selectedOption: option,
      timeTaken: timeTaken || (question?.timeLimit - timeLeft)
    });
  }, [selectedOption, status, quizId, question, timeLeft]);

  useEffect(() => {
    if (status === 'waiting' || status === 'ended' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isHost) {
            const s = getSocket();
            s.emit('question-ended', { quizId: parseInt(quizId) });
            setTimeout(() => {
              s.emit('next-question', { quizId: parseInt(quizId), currentIndex: question?.orderIndex });
            }, 3500);
          } else if (!selectedOption && status === 'playing') {
            submitAnswer(null, question?.timeLimit);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, selectedOption, question, isHost, submitAnswer, quizId]);

  const getRankChange = (nickname) => {
    if (!prevLeaderboard || prevLeaderboard.length === 0) return null;
    const prevRank = prevLeaderboard.findIndex(p => p.nickname === nickname);
    const currentRank = leaderboard.findIndex(p => p.nickname === nickname);
    if (prevRank === -1 || currentRank === -1) return null;
    if (currentRank < prevRank) return 'up';
    if (currentRank > prevRank) return 'down';
    return 'same';
  };

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1c1c1c] to-[#141e15] flex flex-col items-center justify-center p-4">
        {error && <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-xl mb-6 animate-shake max-w-md text-center">{error}</div>}
        <div className="card max-w-md w-full text-center border-none bg-white/5 backdrop-blur-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#30A138] mx-auto mb-6"></div>
          <h2 className="text-2xl font-black mb-4 text-white uppercase italic tracking-tighter">Lobiye Bağlanılıyor</h2>
          <div className="bg-black/40 p-6 rounded-2xl mb-4 border border-white/5">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">KİMLİĞİN</p>
            <p className="text-2xl font-black text-[#30A138]">{nickname}</p>
          </div>
          <p className="text-gray-500 text-xs font-bold animate-pulse">Hazır ol! Yarışma birazdan başlayacak...</p>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1c1c1c] to-[#141e15] p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-16">
             <h2 className="text-6xl font-black mb-4 text-white uppercase tracking-tighter italic shadow-emerald-500/20 drop-shadow-2xl">PODYUM</h2>
             <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-[#30A138] to-transparent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16">
              {leaderboard[1] && (
                <div className="order-2 md:order-1 flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-center mb-4 text-white font-black text-xl">{leaderboard[1].nickname}</div>
                  <div className="h-44 w-full bg-gradient-to-t from-gray-800 to-gray-700 rounded-t-[2.5rem] flex items-center justify-center text-7xl font-black text-white/10 relative border-x border-t border-white/10">
                    2 <div className="absolute -top-8 text-5xl">🥈</div>
                  </div>
                </div>
              )}
              {leaderboard[0] && (
                <div className="order-1 md:order-2 flex flex-col items-center animate-rank-up">
                  <div className="text-center mb-6 text-yellow-500 text-3xl font-black drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">{leaderboard[0].nickname}</div>
                  <div className="h-64 w-full bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-[2.5rem] flex items-center justify-center text-9xl font-black text-white/20 relative shadow-[0_0_50px_rgba(234,179,8,0.4)] border-x border-t border-yellow-300/50">
                    1 <div className="absolute -top-12 text-7xl">🏆</div>
                  </div>
                </div>
              )}
              {leaderboard[2] && (
                <div className="order-3 md:order-3 flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.4s' }}>
                  <div className="text-center mb-4 text-white font-black text-xl">{leaderboard[2].nickname}</div>
                  <div className="h-36 w-full bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-[2.5rem] flex items-center justify-center text-6xl font-black text-white/10 relative border-x border-t border-orange-500/20">
                    3 <div className="absolute -top-8 text-5xl">🥉</div>
                  </div>
                </div>
              )}
          </div>

          <div className="card mb-12 bg-white/5 backdrop-blur-md border-white/10 p-10">
            <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Tüm Sıralama</h3>
            <div className="space-y-4">
              {leaderboard.slice(3, 10).map((p, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-2xl transition-all ${p.nickname === nickname ? 'bg-[#30A138]/20 border border-[#30A138] scale-[1.02]' : 'bg-black/30'}`}>
                  <div className="flex items-center gap-6">
                    <span className="font-black text-gray-600 text-lg w-6">{i + 4}</span>
                    <span className="font-bold text-white text-lg">{p.nickname}</span>
                  </div>
                  <span className="font-black text-2xl text-[#30A138]">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary w-full py-6 text-2xl font-black rounded-[2rem] shadow-[0_15px_30px_rgba(48,161,56,0.3)]">ANA MENÜYE DÖN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1c1c] via-[#1a1a1a] to-[#141e15] text-white flex flex-col">
      {/* Progress Indicator - Kahoot Style Dashboards */}
      <div className="w-full h-8 bg-black/30 flex gap-1.5 px-6 pt-5 pb-1">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-1.5 rounded-sm transition-all duration-700 ${i < (question?.orderIndex || 0) ? 'bg-[#30A138]' : i === (question?.orderIndex || 0) ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <header className="px-6 py-4 md:py-8 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">SORU</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black italic">{question?.orderIndex + 1}</span>
            <span className="text-gray-600 font-bold">/ {totalQuestions}</span>
          </div>
        </div>
        
        <div className="relative group">
          <div className={`w-20 h-20 rounded-full border-[7px] flex items-center justify-center text-3xl font-black transition-all duration-300 shadow-2xl bg-black/20 ${timeLeft <= 5 ? 'border-red-600 text-red-600 scale-110 animate-pulse' : 'border-[#30A138] text-[#30A138]'}`}>
            {timeLeft}
          </div>
          {timeLeft <= 5 && <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping"></div>}
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">SKOR</span>
          <span className="text-3xl font-black text-[#30A138] drop-shadow-lg">{totalScore}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 md:px-12 max-w-7xl mx-auto w-full relative">
        {timeLeft === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in py-12">
             <div className="w-full bg-[#232323] rounded-[4rem] p-10 md:p-16 shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#30A138] to-transparent"></div>
                <h3 className="text-5xl font-black mb-12 text-center uppercase tracking-tighter italic text-white/90">LİDERLİK TABLOSU</h3>
                <div className="space-y-4 max-w-3xl mx-auto">
                  {leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-6">
                      <div className="w-14 h-14 border-4 border-[#30A138]/20 border-t-[#30A138] rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-bold animate-pulse text-xl">PUANLAR HESAPLANIYOR...</p>
                    </div>
                  ) : (
                    leaderboard.slice(0, 5).map((p, i) => {
                      const change = getRankChange(p.nickname);
                      const isMe = p.nickname === nickname;
                      return (
                        <div key={i} className={`flex justify-between items-center p-6 rounded-[2rem] transition-all duration-500 ${isMe ? 'bg-[#30A138] text-white scale-[1.04] shadow-[0_15px_40px_rgba(48,161,56,0.3)] z-10' : 'bg-black/30 border border-white/5'}`}>
                          <div className="flex items-center gap-6">
                            <span className={`font-black text-2xl w-8 ${isMe ? 'text-white/50' : 'text-gray-600'}`}>{i + 1}</span>
                            <span className="font-black text-xl tracking-tight">{p.nickname}</span>
                            {change === 'up' && <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black animate-bounce">▲ YÜKSELDİ</span>}
                            {change === 'down' && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black animate-bounce">▼ DÜŞTÜ</span>}
                          </div>
                          <span className="font-black text-3xl tracking-tighter">{p.score}</span>
                        </div>
                      );
                    })
                  )}
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center mb-12 min-h-[40vh]">
              <h2 className="text-4xl md:text-6xl font-black text-white text-center mb-12 leading-[1.1] tracking-tight max-w-5xl">
                {question?.text}
              </h2>
              {question?.image_url && (
                <div className="p-3 bg-white/5 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#30A138] to-blue-600 rounded-[3rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                  <img src={question.image_url} alt="Q" className="relative rounded-[2.5rem] max-h-[42vh] object-contain" />
                </div>
              )}
            </div>

            {/* Answer Result Overlay - Elegant Corner Card */}
            {answerResult && !isHost && (
              <div className="fixed bottom-10 right-10 z-[60] bg-[#232323]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-bounce-in flex items-center gap-6 min-w-[300px]">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg ${answerResult.isCorrect ? 'bg-[#30A138] shadow-emerald-500/30' : 'bg-red-600 shadow-red-500/30'}`}>
                  {answerResult.isCorrect ? '✨' : '💨'}
                </div>
                <div className="text-left flex-1">
                  <div className={`font-black text-3xl uppercase italic tracking-tighter ${answerResult.isCorrect ? 'text-[#30A138]' : 'text-red-500'}`}>
                    {answerResult.isCorrect ? 'HARİKA!' : 'OLMADI!'}
                  </div>
                  <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                    {answerResult.isCorrect ? `+${answerResult.pointsEarned} PUAN KAZANDIN` : 'SIKI DUR, DİĞER SORUDA GÖSTER!'}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => submitAnswer(opt, question.timeLimit - timeLeft)}
                    disabled={selectedOption !== null || isHost}
                    className={`quiz-option-${opt.toLowerCase()} p-7 md:p-10 rounded-[2.5rem] text-2xl md:text-3xl font-black flex items-center gap-6 transition-all duration-300 relative overflow-hidden ${selectedOption !== null && !isSelected ? 'opacity-20 scale-95 grayscale-[0.5]' : 'scale-100 shadow-lg'} ${isSelected ? 'ring-[12px] ring-white/20 z-10' : ''}`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-xl border border-white/10">
                      {opt}
                    </div>
                    <span className="truncate flex-1 text-left tracking-tight">{question?.options?.[opt]}</span>
                    {isSelected && <div className="absolute right-8 text-4xl animate-bounce">⭐</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
      {isHost && <div className="bg-[#30A138] text-white p-2 text-center text-xs font-black uppercase tracking-[0.4em] shadow-inner">HOST YÖNETİM PANELİ</div>}
    </div>
  );
}
