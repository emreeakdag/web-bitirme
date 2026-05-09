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
            YARIŞMA <span className="text-[#30A138]">SONUÇLARI</span>
           </h1>
           <div className="h-2 w-32 bg-gradient-to-r from-transparent via-[#30A138] to-transparent rounded-full"></div>
        </div>
        
        {/* Top 3 Podium */}
        <div className="flex flex-row justify-center items-end gap-2 md:gap-8 mb-16 px-2 md:px-4">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="flex-1 max-w-[120px] md:max-w-none flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-center mb-2 md:mb-6 w-full truncate px-1">
                  <p className="text-sm md:text-xl font-black text-gray-300 truncate">{leaderboard[1].nickname}</p>
                  <p className="text-[10px] md:text-sm text-gray-500 font-bold">{leaderboard[1].score} PUAN</p>
                </div>
                <div className="w-full h-32 md:h-48 bg-gradient-to-b from-gray-400/20 to-[#111] rounded-t-[1.5rem] md:rounded-t-[2.5rem] flex items-center justify-center text-4xl md:text-7xl font-black text-gray-400/10 relative shadow-[0_-10px_40px_rgba(156,163,175,0.1)] border-x-2 border-t-2 border-gray-400/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                  2
                </div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="flex-1 max-w-[140px] md:max-w-none flex flex-col items-center animate-rank-up z-10">
                <div className="text-center mb-3 md:mb-8 w-full truncate px-1">
                  <p className="text-base md:text-3xl font-black text-yellow-500 truncate mb-1">{leaderboard[0].nickname}</p>
                  <p className="text-xs md:text-xl text-yellow-600 font-black">{leaderboard[0].score} PUAN</p>
                </div>
                <div className="w-full h-48 md:h-72 bg-gradient-to-b from-yellow-400/20 to-[#111] rounded-t-[1.5rem] md:rounded-t-[3rem] flex items-center justify-center text-6xl md:text-9xl font-black text-yellow-400/10 relative shadow-[0_-10px_50px_rgba(250,204,21,0.15)] border-x-2 border-t-2 border-yellow-400/40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none"></div>
                  1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="flex-1 max-w-[120px] md:max-w-none flex flex-col items-center animate-rank-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-center mb-2 md:mb-6 w-full truncate px-1">
                  <p className="text-sm md:text-xl font-black text-orange-400 truncate">{leaderboard[2].nickname}</p>
                  <p className="text-[10px] md:text-sm text-orange-700 font-bold">{leaderboard[2].score} PUAN</p>
                </div>
                <div className="w-full h-24 md:h-36 bg-gradient-to-b from-orange-500/20 to-[#111] rounded-t-[1.5rem] md:rounded-t-[2.5rem] flex items-center justify-center text-3xl md:text-6xl font-black text-orange-500/10 relative shadow-[0_-10px_30px_rgba(249,115,22,0.1)] border-x-2 border-t-2 border-orange-500/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                  3
                </div>
              </div>
            )}
        </div>

        {/* Other Players */}
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
                <div key={idx} className={`flex justify-between items-center px-4 py-2 sm:py-3 rounded-lg ${bgClass} hover:bg-white/10 transition-colors border hover:border-white/10`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`${rankColor} font-black text-sm sm:text-lg w-5 text-center`}>{idx + 1}.</span>
                    <div>
                      <p className={`font-bold text-sm sm:text-base tracking-tight leading-tight ${idx === 0 ? 'text-yellow-500' : 'text-white'}`}>{player.nickname}</p>
                      <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">
                        {player.correct_answers} D / {player.total_answers} T
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    <span className={`font-black text-base sm:text-xl tracking-tighter ${isTop3 ? 'text-white' : 'text-[#30A138]'}`}>{player.score}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">pts</span>
                  </div>
                </div>
              );
            })}
            
            {leaderboard.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-600 font-bold italic">Kayıtlı sonuç bulunmuyor.</p>
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
