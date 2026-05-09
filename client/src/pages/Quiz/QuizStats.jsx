import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function QuizStats() {
  const { quizId } = useParams();
  const [stats, setStats] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGet(`/quiz/${quizId}/stats`);
        if (data.success) {
          setStats(data.stats);
          setQuizTitle(data.quizTitle);
        } else {
          setError(data.message || 'İstatistikler yüklenemedi.');
        }
      } catch (err) {
        console.error('Istatistikler yuklenemedi:', err);
        setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#30A138]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase">{error}</h2>
        <button onClick={() => navigate('/my-quizzes')} className="btn-secondary">Geri Dön</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate('/my-quizzes')}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{quizTitle || 'YARIŞMA'} - İSTATİSTİKLER</h1>
          <div className="h-1 w-20 bg-[#30A138] mt-1 rounded-full"></div>
        </div>
      </div>

      <div className="grid gap-6">
        {stats.length > 0 ? stats.map((s, idx) => (
          <div key={s.id} className="card bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#30A138]/20 flex items-center justify-center text-[#30A138] font-black text-lg border border-[#30A138]/20">
                    {idx + 1}
                  </span>
                  <h3 className="font-black text-xl text-white break-words">{s.question_text}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  <div className={`p-3 rounded-xl border ${s.correct_option === 'A' ? 'bg-[#30A138]/10 border-[#30A138]/30 text-[#30A138]' : 'bg-black/20 border-white/5 text-gray-500'}`}>
                    <span className="font-black mr-2">A)</span> {s.option_a}
                  </div>
                  <div className={`p-3 rounded-xl border ${s.correct_option === 'B' ? 'bg-[#30A138]/10 border-[#30A138]/30 text-[#30A138]' : 'bg-black/20 border-white/5 text-gray-500'}`}>
                    <span className="font-black mr-2">B)</span> {s.option_b}
                  </div>
                  <div className={`p-3 rounded-xl border ${s.correct_option === 'C' ? 'bg-[#30A138]/10 border-[#30A138]/30 text-[#30A138]' : 'bg-black/20 border-white/5 text-gray-500'}`}>
                    <span className="font-black mr-2">C)</span> {s.option_c}
                  </div>
                  <div className={`p-3 rounded-xl border ${s.correct_option === 'D' ? 'bg-[#30A138]/10 border-[#30A138]/30 text-[#30A138]' : 'bg-black/20 border-white/5 text-gray-500'}`}>
                    <span className="font-black mr-2">D)</span> {s.option_d}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-24 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center group">
                  <div className="text-2xl font-black text-green-500 group-hover:scale-110 transition-transform">{s.correct_count || 0}</div>
                  <div className="text-[10px] font-black text-green-500/60 uppercase tracking-widest mt-1">DOĞRU</div>
                </div>
                <div className="flex-1 md:w-24 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center group">
                  <div className="text-2xl font-black text-red-500 group-hover:scale-110 transition-transform">{s.incorrect_count || 0}</div>
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mt-1">YANLIŞ</div>
                </div>
                <div className="flex-1 md:w-24 p-4 rounded-2xl bg-gray-500/10 border border-white/5 text-center group">
                  <div className="text-2xl font-black text-gray-400 group-hover:scale-110 transition-transform">{s.empty_count || 0}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">BOŞ</div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="card text-center py-20 bg-white/5 border-white/5">
            <p className="text-gray-400 font-medium italic">Bu yarışmaya ait soru bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
