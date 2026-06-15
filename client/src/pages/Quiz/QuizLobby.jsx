import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiGet } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { resolveAppBaseUrl } from '../../lib/runtime';

export default function QuizLobby() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [toast, setToast] = useState({ msg: '', type: 'error' });
  const [copySuccess, setCopySuccess] = useState(false);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'error' }), 3000);
  };

  useEffect(() => {
    const loadBaseUrl = async () => {
      const resolved = await resolveAppBaseUrl();
      setBaseUrl(resolved || window.location.origin);
    };

    const fetchQuiz = async () => {
      try {
        const data = await apiGet(`/quiz/info/${quizId}`);
        if (data.success) {
          if (data.quiz.question_count === 0) {
            showToast('Bu yarışmada hiç soru yok! Lütfen önce soru ekleyin.');
            setTimeout(() => navigate(`/quiz/${quizId}/questions`), 1500);
            return;
          }
          setQuiz(data.quiz);
        }
      } catch (err) {
        console.error('Quiz bilgisi alınamadı:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBaseUrl();
    fetchQuiz();

    const socket = getSocket();
    socket.emit('host-join-quiz', { quizId });

    const handlePlayerJoined = ({ nickname }) => {
      setParticipants(prev => {
        if (!prev.find(p => p.nickname === nickname)) {
          return [...prev, { nickname, score: 0 }];
        }
        return prev;
      });
    };

    socket.on('player-joined', handlePlayerJoined);

    const interval = setInterval(async () => {
      try {
        const data = await apiGet(`/quiz/${quizId}/leaderboard`);
        if (data.success) {
          setParticipants(data.leaderboard);
        }
      } catch {
        // sessizce geç
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('player-joined', handlePlayerJoined);
    };
  }, [quizId, navigate]);

  const handleStart = () => {
    sessionStorage.setItem('quiz_nickname', 'Yonetici (Siz)');
    sessionStorage.setItem('quiz_pin', quiz?.pin_code || '');

    if (quiz?.status === 'active') {
      navigate(`/play-quiz/${quizId}?host=true`);
      return;
    }

    const socket = getSocket();
    socket.emit('start-quiz', { quizId: parseInt(quizId) });
    setStarting(true);
    navigate(`/play-quiz/${quizId}?host=true`);
  };

  const buttonLabel =
    quiz?.status === 'completed'
      ? 'TAMAMLANMIŞ'
      : quiz?.status === 'active'
        ? 'DEVAM ET'
        : starting
          ? 'BAŞLATILIYOR...'
          : 'YARIŞMAYI BAŞLAT';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#141e15] text-white flex flex-col font-sans relative">
      {toast.msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] ${toast.type === 'success' ? 'bg-[#30A138]' : 'bg-red-600'} text-white px-6 py-3 rounded-full shadow-lg font-black uppercase tracking-widest text-sm animate-bounce-in whitespace-nowrap pointer-events-none border border-white/20`}>
          {toast.msg}
        </div>
      )}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#30A138] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>

      <header className="px-4 sm:px-6 py-4 md:px-12 flex justify-between items-center bg-black/20 border-b border-white/5 relative z-10">
        <Link to="/my-quizzes" className="text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all group">
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span> HAZIRLIĞA DÖN
        </Link>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-full border border-white/10 shadow-lg">
          <div className="w-2.5 h-2.5 bg-[#30A138] rounded-full animate-ping"></div>
          <div className="w-2.5 h-2.5 bg-[#30A138] rounded-full absolute"></div>
          <span className="text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] ml-1">LOBİ AKTİF</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 md:p-12 w-full max-w-7xl mx-auto relative z-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter mb-10 text-center drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          {quiz?.title || 'Yükleniyor...'}
        </h1>

        <div className="flex flex-col items-center bg-[#111] p-6 sm:p-10 md:p-16 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl mb-12 w-full max-w-3xl relative overflow-hidden group mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-[#30A138]/5 to-transparent pointer-events-none"></div>

          <div className="flex flex-col items-center justify-center relative z-10 mb-10">
            <span className="text-gray-400 font-black text-sm uppercase tracking-[0.4em] mb-6">HIZLI KATIL</span>
            <div className="bg-white p-6 rounded-[3rem] shadow-[0_0_80px_rgba(48,161,56,0.15)] transform transition-all duration-500 hover:scale-105 border-4 border-white/10">
              <QRCodeSVG
                value={`${baseUrl}/join-quiz?pin=${quiz?.pin_code}`}
                size={250}
                style={{ width: '100%', height: 'auto', maxWidth: '320px' }}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] mt-8 bg-white/5 px-6 py-2 rounded-full border border-white/5">
              Kameranı Okut
            </span>
          </div>

          <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10"></div>

          <div className="flex flex-col items-center justify-center text-center relative z-10 w-full">
            <span className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-3">VEYA KOD İLE GİRİŞ YAP</span>
            <div
              className="bg-black/60 px-6 sm:px-12 py-5 rounded-[1.5rem] border border-white/10 w-full max-w-sm shadow-inner group-hover:border-[#30A138]/30 transition-all cursor-pointer relative"
              title="Kodu Kopyala"
              onClick={() => {
                navigator.clipboard.writeText(quiz?.pin_code || '');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              }}
            >
              {copySuccess && (
                <div className="absolute -top-3 -right-3 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce-in z-20">
                  ✓
                </div>
              )}
              <span className="text-5xl font-black text-white tracking-[0.2em] drop-shadow-md">
                {quiz?.pin_code}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="font-black text-xl uppercase tracking-[0.1em] text-white">OYUNCULAR</h3>
            <span className="bg-[#30A138] text-white px-4 py-1.5 rounded-full text-lg font-black shadow-[0_0_15px_rgba(48,161,56,0.4)]">
              {participants.length}
            </span>
          </div>

          <button
            onClick={handleStart}
            className="w-full sm:w-auto bg-[#30A138] text-white px-12 py-5 rounded-2xl text-xl font-black shadow-[0_15px_40px_rgba(48,161,56,0.3)] active:scale-95 transition-all disabled:opacity-50 hover:bg-[#25822b] disabled:hover:bg-[#30A138] disabled:cursor-not-allowed uppercase tracking-wider"
            disabled={starting || quiz?.status === 'completed'}
            title={quiz?.status === 'completed' ? 'Bu yarışma zaten tamamlanmış.' : ''}
          >
            {buttonLabel}
          </button>
        </div>

        <div className="w-full max-w-5xl">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-6">
              <div className="w-16 h-16 border-4 border-dashed border-white rounded-full animate-spin"></div>
              <p className="font-black text-lg uppercase tracking-widest text-center">Öğrencilerin katılması bekleniyor...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {participants.map((p, idx) => (
                <div key={idx} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center gap-3 animate-bounce-in shadow-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#30A138]/20 flex items-center justify-center font-black text-[#30A138] text-xs shrink-0 border border-[#30A138]/20">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-white truncate text-sm">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
