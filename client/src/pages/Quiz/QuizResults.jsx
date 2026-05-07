import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function QuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await apiGet(`/quiz/${quizId}/leaderboard`);
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Sonuclar getirilemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#30A138]/20 border-t-[#30A138] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-black tracking-widest animate-pulse uppercase">Sonuçlar Hazırlanıyor</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-16">
           <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-center">
            FİNAL <span className="text-[#30A138]">SIRALAMA</span>
           </h1>
           <div className="h-2 w-32 bg-gradient-to-r from-transparent via-[#30A138] to-transparent rounded-full"></div>
        </div>
        
        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16 px-4">
            {/* 2nd Place */}
            <div className="order-2 md:order-1">
              {leaderboard[1] && (
                <div className="flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-center mb-6">
                    <p className="text-xl font-black truncate max-w-[150px]">{leaderboard[1].nickname}</p>
                    <p className="text-gray-400 font-bold">{leaderboard[1].score} PUAN</p>
                  </div>
                  <div className="w-full h-48 bg-gradient-to-t from-gray-900 to-gray-700 rounded-t-[2.5rem] flex items-center justify-center text-7xl font-black text-white/5 relative border-x border-t border-white/10 shadow-2xl">
                    2
                    <div className="absolute -top-8 text-5xl">🥈</div>
                  </div>
                </div>
              )}
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2">
              {leaderboard[0] && (
                <div className="flex flex-col items-center animate-rank-up">
                  <div className="text-center mb-8">
                    <p className="text-3xl font-black text-yellow-500 truncate max-w-[200px] mb-1">👑 {leaderboard[0].nickname}</p>
                    <p className="text-yellow-400/80 font-black text-xl">{leaderboard[0].score} PUAN</p>
                  </div>
                  <div className="w-full h-72 bg-gradient-to-t from-yellow-950 via-yellow-600 to-yellow-400 rounded-t-[3rem] flex items-center justify-center text-9xl font-black text-white/10 relative shadow-[0_0_80px_rgba(234,179,8,0.2)] border-x border-t border-yellow-300/30">
                    1
                    <div className="absolute -top-12 text-7xl animate-bounce">🏆</div>
                  </div>
                </div>
              )}
            </div>

            {/* 3rd Place */}
            <div className="order-3 md:order-3">
              {leaderboard[2] && (
                <div className="flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.4s' }}>
                  <div className="text-center mb-6">
                    <p className="text-xl font-black truncate max-w-[150px]">{leaderboard[2].nickname}</p>
                    <p className="text-gray-400 font-bold">{leaderboard[2].score} PUAN</p>
                  </div>
                  <div className="w-full h-36 bg-gradient-to-t from-orange-950 to-orange-800 rounded-t-[2.5rem] flex items-center justify-center text-6xl font-black text-white/5 relative border-x border-t border-orange-500/20 shadow-2xl">
                    3
                    <div className="absolute -top-8 text-5xl">🥉</div>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Other Players */}
        <div className="bg-[#111] rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl mb-12">
          <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="text-gray-500 font-black uppercase text-xs tracking-[0.3em]">Diğer Yarışmacılar</h3>
            <span className="bg-[#30A138]/10 text-[#30A138] px-4 py-1 rounded-full text-xs font-black">TOP 10</span>
          </div>
          
          <div className="space-y-4">
            {leaderboard.slice(3, 10).map((player, idx) => (
              <div key={idx} className="group flex justify-between items-center p-6 rounded-3xl bg-black/40 hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/5">
                <div className="flex items-center gap-8">
                  <span className="text-gray-700 font-black text-2xl w-8 group-hover:text-[#30A138] transition-colors">{idx + 4}</span>
                  <div>
                    <p className="font-black text-white text-xl tracking-tight">{player.nickname}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {player.correct_answers} DOĞRU / {player.total_answers} TOPLAM
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-[#30A138] text-2xl tracking-tighter italic">{player.score}</span>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">puan</p>
                </div>
              </div>
            ))}
            
            {leaderboard.length <= 3 && (
              <div className="py-12 text-center">
                <p className="text-gray-600 font-bold italic">Başka katılımcı bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex-1 bg-white text-black hover:bg-gray-200 py-6 rounded-3xl text-xl font-black transition-all shadow-xl active:scale-95"
          >
            ANA SAYFAYA DÖN
          </button>
          <button 
            onClick={() => window.print()} 
            className="md:w-1/3 bg-[#111] text-white hover:bg-[#1a1a1a] border border-white/10 py-6 rounded-3xl text-xl font-black transition-all active:scale-95"
          >
            SONUÇLARI YAZDIR
          </button>
        </div>
      </div>
    </div>
  );
}
