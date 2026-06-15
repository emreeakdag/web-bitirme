import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';

const getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const getJoinedQuizStorageKey = () => {
  const user = getCurrentUser();
  return user?.id ? `joined_quizzes_${user.id}` : 'joined_quizzes_guest';
};

export default function JoinedQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const user = getCurrentUser();

      try {
        if (user?.id) {
          const data = await apiGet('/quiz/joined-quizzes');
          if (data.success) {
            setQuizzes(data.quizzes || []);
            return;
          }
        }

        const stored = JSON.parse(localStorage.getItem(getJoinedQuizStorageKey()) || '[]');
        setQuizzes(stored);
      } catch (err) {
        console.error('Yarismalar getirilemedi:', err);
        const stored = JSON.parse(localStorage.getItem(getJoinedQuizStorageKey()) || '[]');
        setQuizzes(stored);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#30A138]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">KATILDIĞIM YARIŞMALAR</h1>
          <div className="h-1 w-20 bg-[#30A138] mt-1 rounded-full"></div>
        </div>
        <Link to="/join-quiz" className="btn-primary">
          + Yeni Yarışma Bul
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card group bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-black text-2xl mb-3 text-white group-hover:text-[#30A138] transition-colors">{quiz.title}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed italic font-medium">
                {quiz.description || 'Açıklama belirtilmemiş.'}
              </p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PIN:</span>
                <span className="font-bold text-[#30A138] text-xs uppercase tracking-wider">{quiz.pin_code}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DURUM</span>
                <span className="text-lg font-black text-white">
                  {quiz.status === 'active' ? 'AKTİF' : quiz.status === 'completed' ? 'TAMAMLANDI' : 'TASLAK'}
                </span>
              </div>
              <Link to={`/play-quiz/${quiz.id}`} className="btn-secondary w-full text-center block text-xs tracking-widest py-3">
                YARIŞMAYA GİT
              </Link>
            </div>
          </div>
        ))}

        {quizzes.length === 0 && (
          <div className="card col-span-full text-center py-24 flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-6 font-medium">Henüz bir yarışmaya katılmadın.</p>
            <Link to="/join-quiz" className="btn-primary">
              Yarışma Bul
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
