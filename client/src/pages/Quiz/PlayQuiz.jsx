import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket, joinQuizRoom, leaveQuizRoom } from '../../lib/socket';

const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // Soft UI tick
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};

export default function PlayQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isHost = new URLSearchParams(window.location.search).get('host') === 'true';
  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const [nickname] = useState(() => sessionStorage.getItem('quiz_nickname') || 'Misafir');
  const [pin] = useState(() => sessionStorage.getItem('quiz_pin') || '');

  const [status, setStatus] = useState('waiting'); // waiting, playing, answered, ended
  const isJoinedRef = useRef(false);
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
      audioRef.current.volume = type === 'correct' ? 0.3 : (type === 'wrong' ? 0.2 : 0.4);
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
      userId: currentUser?.id || null,
      onJoined: (data) => {
        console.log('Yarismaya katildiniz:', data);
        isJoinedRef.current = true;
        setError('');
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
        if (err?.message === 'Yarismaya katilirken hata olustu.' && isJoinedRef.current) {
          // Ignore this error if we are already successfully joined (likely a duplicate StrictMode emit)
          return;
        }
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
  }, [quizId, pin, nickname, navigate, isHost, totalQuestions, currentUser?.id]);

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
        {error && !isJoinedRef.current && <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-xl mb-6 animate-shake max-w-md text-center">{error}</div>}
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

          <div className="flex flex-row justify-center items-end gap-2 sm:gap-8 mb-16 px-2">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="flex-1 max-w-[120px] sm:max-w-none flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-center mb-2 sm:mb-4 w-full truncate px-1">
                  <p className="text-sm sm:text-xl font-black text-gray-300 truncate">{leaderboard[1].nickname}</p>
                </div>
                <div className="w-full h-32 sm:h-44 bg-gradient-to-b from-gray-400/20 to-[#111] rounded-t-[1.5rem] sm:rounded-t-[2.5rem] flex items-center justify-center text-4xl sm:text-7xl font-black text-gray-400/10 relative shadow-[0_-10px_40px_rgba(156,163,175,0.1)] border-x-2 border-t-2 border-gray-400/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                  2
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="flex-1 max-w-[140px] sm:max-w-none flex flex-col items-center animate-rank-up z-10">
                <div className="text-center mb-3 sm:mb-6 w-full truncate px-1">
                  <p className="text-base sm:text-3xl font-black text-yellow-500 truncate mb-1">{leaderboard[0].nickname}</p>
                </div>
                <div className="w-full h-48 sm:h-64 bg-gradient-to-b from-yellow-400/20 to-[#111] rounded-t-[1.5rem] sm:rounded-t-[3rem] flex items-center justify-center text-6xl sm:text-9xl font-black text-yellow-400/10 relative shadow-[0_-10px_50px_rgba(250,204,21,0.15)] border-x-2 border-t-2 border-yellow-400/40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none"></div>
                  1
                </div>
              </div>
            )}
            
            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="flex-1 max-w-[120px] sm:max-w-none flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-center mb-2 sm:mb-4 w-full truncate px-1">
                  <p className="text-sm sm:text-xl font-black text-orange-400 truncate">{leaderboard[2].nickname}</p>
                </div>
                <div className="w-full h-24 sm:h-36 bg-gradient-to-b from-orange-500/20 to-[#111] rounded-t-[1.5rem] sm:rounded-t-[2.5rem] flex items-center justify-center text-3xl sm:text-6xl font-black text-orange-500/10 relative shadow-[0_-10px_30px_rgba(249,115,22,0.1)] border-x-2 border-t-2 border-orange-500/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                  3
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#111] rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl mb-12 relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6 relative z-10">
              <h3 className="text-gray-400 font-black uppercase text-sm tracking-[0.3em]">Genel Sıralama</h3>
              <span className="bg-[#30A138]/10 text-[#30A138] px-4 py-1 rounded-full text-xs font-black border border-[#30A138]/20">TÜM LİSTE</span>
            </div>
            <div className="space-y-4 relative z-10">
              {leaderboard.map((player, idx) => {
                const isTop3 = idx < 3;
                const rankColor = idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-600';
                const bgClass = isTop3 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-transparent';
                
                return (
                  <div key={idx} className={`flex justify-between items-center px-4 py-2 sm:py-3 rounded-lg ${bgClass} hover:bg-white/10 transition-colors border hover:border-white/10 ${player.nickname === nickname ? 'ring-1 ring-[#30A138]' : ''}`}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className={`${rankColor} font-black text-sm sm:text-lg w-5 text-center`}>{idx + 1}.</span>
                      <div>
                        <p className={`font-bold text-sm sm:text-base tracking-tight leading-tight ${idx === 0 ? 'text-yellow-500' : 'text-white'}`}>{player.nickname}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className={`font-black text-base sm:text-xl tracking-tighter ${isTop3 ? 'text-white' : 'text-[#30A138]'}`}>{player.score}</span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary w-full py-6 text-2xl font-black rounded-[2rem] shadow-[0_15px_30px_rgba(48,161,56,0.3)]">ANA MENÜYE DÖN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 inset-x-0 bottom-0 flex flex-col bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0f1710] text-white overflow-hidden z-40">
      {/* Premium Progress Indicator */}
      <div className="w-full bg-black/40 backdrop-blur-md border-b border-white/5 py-3 px-6 sm:px-12 flex flex-col gap-2 z-10 shadow-lg shrink-0">
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">
          <span>Soru {question?.orderIndex + 1} / {totalQuestions}</span>
          <span className="text-[#30A138]">{Math.round((((question?.orderIndex || 0) + 1) / totalQuestions) * 100)}% Tamamlandı</span>
        </div>
        <div className="w-full h-2.5 sm:h-3 bg-black/60 rounded-full flex gap-1 sm:gap-2 p-0.5 border border-white/10">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-full transition-all duration-500 ease-out ${i < (question?.orderIndex || 0)
                  ? 'bg-gradient-to-r from-[#30A138] to-[#3cd346] shadow-[0_0_8px_rgba(48,161,56,0.6)]'
                  : i === (question?.orderIndex || 0)
                    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)] animate-pulse'
                    : 'bg-white/10'
                }`}
            />
          ))}
        </div>
      </div>

      <header className="px-4 sm:px-8 py-3 flex justify-between items-center shrink-0">
        <div className="flex flex-col opacity-0">
          {/* Placeholder to balance flex-between */}
        </div>

        {/* Professional SVG Timer */}
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center group shrink-0">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/40" />
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={(2 * Math.PI * 42) - (timeLeft / (question?.timeLimit || 20)) * (2 * Math.PI * 42)}
              className={`transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'text-red-500' : 'text-[#30A138]'}`}
              strokeLinecap="round" />
          </svg>
          <span className={`text-2xl sm:text-4xl font-black tabular-nums tracking-tighter ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}
          </span>
          {timeLeft <= 5 && <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping pointer-events-none"></div>}
        </div>

        {isHost ? (
          <div className="flex flex-col opacity-0 pointer-events-none">
            <span className="text-[10px]">SKOR</span>
            <span className="text-xl sm:text-3xl">0</span>
          </div>
        ) : (
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">SKOR</span>
            <span className="text-xl sm:text-3xl font-black text-[#30A138] drop-shadow-lg">{totalScore}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col px-2 sm:px-6 md:px-12 max-w-7xl mx-auto w-full relative min-h-0">
        {timeLeft === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in py-4 sm:py-12 px-2 sm:px-0">
            <div className="w-full max-w-2xl bg-black/60 backdrop-blur-xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 via-[#30A138] to-blue-600"></div>
              <h3 className="text-2xl sm:text-5xl font-black mb-6 sm:mb-10 text-center uppercase tracking-tighter italic text-white drop-shadow-md">GÜNCEL SIRALAMA</h3>
              <div className="space-y-3 sm:space-y-4 w-full">
                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <div className="w-10 h-10 border-4 border-[#30A138]/20 border-t-[#30A138] rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold animate-pulse text-sm">PUANLAR HESAPLANIYOR...</p>
                  </div>
                ) : (
                  leaderboard.slice(0, 5).map((p, i) => {
                    const change = getRankChange(p.nickname);
                    const isMe = p.nickname === nickname;
                    const maxScore = leaderboard[0]?.score || 1;
                    const barWidth = Math.max(10, (p.score / maxScore) * 100);
                    return (
                      <div key={i} className={`flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500 relative overflow-hidden ${isMe ? 'bg-gradient-to-r from-[#30A138]/90 to-[#25822b]/90 text-white scale-[1.02] shadow-[0_10px_20px_rgba(48,161,56,0.3)] ring-2 ring-white/30 z-10' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}>
                        {/* Background score bar */}
                        <div className="absolute top-0 left-0 bottom-0 bg-white/5 transition-all duration-1000 ease-out" style={{ width: `${barWidth}%` }}></div>

                        <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                          <span className={`font-black text-xl sm:text-3xl w-6 sm:w-10 text-center ${i === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>{i + 1}</span>
                          <span className="font-bold text-lg sm:text-2xl tracking-tight truncate max-w-[120px] sm:max-w-[200px]">{p.nickname}</span>
                          {change === 'up' && <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5"><span className="animate-bounce">▲</span></span>}
                          {change === 'down' && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5"><span className="animate-bounce">▼</span></span>}
                        </div>
                        <span className="font-black text-xl sm:text-3xl tracking-tighter relative z-10">{p.score}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full min-h-0 pb-1">
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white text-center leading-[1.2] tracking-tight max-w-5xl line-clamp-4 px-2">
                {question?.text}
              </h2>
              {question?.image_url && (
                <div className="p-1 sm:p-3 bg-white/5 rounded-xl sm:rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] group relative flex-shrink min-h-0 mt-4">
                  <img src={question.image_url} alt="Q" className="relative rounded-lg sm:rounded-[2.5rem] max-h-[25vh] object-contain" />
                </div>
              )}
            </div>

            {/* Answer Result Overlay - Top Bar Style */}
            {answerResult && !isHost && (
              <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-down pointer-events-none">
                <div className={`${answerResult.isCorrect ? 'bg-[#30A138]' : 'bg-red-600'} shadow-2xl py-3 px-6 flex items-center justify-center gap-4 border-b border-white/20`}>
                  <div className="text-2xl">{answerResult.isCorrect ? '✨' : '💨'}</div>
                  <div className="text-center">
                    <div className="font-black text-white text-lg uppercase italic tracking-widest leading-none">
                      {answerResult.isCorrect ? 'HARİKA! DOĞRU CEVAP' : 'OLMADI! YANLIŞ CEVAP'}
                    </div>
                    {answerResult.isCorrect && (
                      <div className="text-[10px] text-white/80 font-bold uppercase tracking-[0.2em] mt-1 leading-none">
                        +{answerResult.pointsEarned} PUAN KAZANDIN
                      </div>
                    )}
                  </div>
                  <div className="text-2xl">{answerResult.isCorrect ? '✨' : '💨'}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 h-[45%] sm:h-auto sm:pb-6 mt-auto flex-shrink-0 w-full">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const OPTION_COLORS = {
                  A: 'bg-[#e21b3c] hover:bg-[#c61734] border-b-[6px] border-[#a3132a]',
                  B: 'bg-[#1368ce] hover:bg-[#1059b0] border-b-[6px] border-[#0d4a92]',
                  C: 'bg-[#d89e00] hover:bg-[#c08c00] border-b-[6px] border-[#a07500]',
                  D: 'bg-[#26890c] hover:bg-[#20750a] border-b-[6px] border-[#1a6108]'
                };
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => submitAnswer(opt, question.timeLimit - timeLeft)}
                    disabled={selectedOption !== null || isHost}
                    className={`${OPTION_COLORS[opt]} p-1 sm:p-6 md:p-10 rounded-md sm:rounded-xl text-white text-sm sm:text-2xl md:text-3xl font-bold flex flex-col justify-center items-center transition-all duration-150 relative overflow-hidden h-full min-h-[4rem] active:border-b-0 active:translate-y-1 ${selectedOption !== null && !isSelected ? 'opacity-30 scale-[0.98] grayscale-[0.5]' : 'scale-100 shadow-md'} ${isSelected ? 'ring-[4px] sm:ring-[10px] ring-white/60 z-10' : ''}`}
                  >
                    <div className="absolute top-1 left-2 sm:top-4 sm:left-4 text-white/90 font-black text-lg sm:text-4xl drop-shadow-sm">
                      {opt}
                    </div>
                    <span className="w-full text-center tracking-tight leading-snug px-1 sm:px-4 mt-4 sm:mt-0 drop-shadow-md text-white line-clamp-3 sm:line-clamp-none pointer-events-none">{question?.options?.[opt]}</span>
                    {isSelected && <div className="absolute top-1 right-2 sm:top-4 sm:right-4 text-lg sm:text-4xl animate-bounce drop-shadow-lg">⭐</div>}
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
