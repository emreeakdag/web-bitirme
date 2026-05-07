import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiDelete } from '../../lib/api';

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // quizId to delete
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  const fetchQuizzes = async () => {
    try {
      const data = await apiGet('/quiz/my-quizzes');
      if (data.success) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Quizler getirilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async () => {
    const quizId = showDeleteModal;
    if (!quizId) return;

    try {
      const data = await apiDelete(`/quiz/${quizId}`);
      if (data.success) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
        showNotify('success', 'Yarışma başarıyla silindi.');
      } else {
        showNotify('error', 'Silme işlemi başarısız oldu.');
      }
    } catch (err) {
      showNotify('error', 'Yarışma silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setShowDeleteModal(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotify('success', 'PIN Kodu Panoya Kopyalandı! 📋');
  };

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#30A138]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Custom Notification Toast */}
      {notification && (
        <div className={`fixed bottom-10 right-10 z-[120] px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-bounce-in flex items-center gap-4 border backdrop-blur-2xl ${
          notification.type === 'success' ? 'bg-[#30A138]/20 border-[#30A138] text-white' : 'bg-red-500/20 border-red-500 text-white'
        }`}>
          <span className="text-xl">{notification.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-black tracking-tight">{notification.message}</span>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteModal(null)}></div>
          <div className="card relative max-w-sm w-full bg-[#1c1c1c] border border-white/10 shadow-2xl animate-bounce-in p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">EMİN MİSİN?</h3>
              <p className="text-gray-400 mb-8 text-xs font-medium">
                Tüm veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="px-6 py-2.5 rounded-lg bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-wider"
              >
                VAZGEÇ
              </button>
              <button 
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-600/20"
              >
                EVET, SİL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">YARIŞMALARIM</h1>
          <div className="h-1 w-20 bg-[#30A138] mt-1 rounded-full"></div>
        </div>
        <Link to="/create-quiz" className="btn-primary flex items-center gap-2">
          <span>+</span> YENİ OLUŞTUR
        </Link>
      </div>

      <div className="grid gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card group bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="font-black text-2xl text-white group-hover:text-[#30A138] transition-colors">{quiz.title}</h3>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                    quiz.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                    quiz.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border border-white/5' :
                    'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {quiz.status === 'active' ? 'AKTİF' : quiz.status === 'completed' ? 'TAMAMLANDI' : 'TASLAK'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-6 line-clamp-1 italic font-medium">{quiz.description || 'Açıklama belirtilmemiş.'}</p>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => copyToClipboard(quiz.pin_code)}
                    className="flex items-center gap-3 bg-black/40 hover:bg-black/60 px-4 py-2 rounded-xl border border-white/5 transition-all group/pin"
                  >
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PIN:</span>
                    <span className="text-lg font-black text-[#30A138] tracking-widest">{quiz.pin_code}</span>
                    <span className="text-xs opacity-0 group-hover/pin:opacity-100 transition-opacity">📋</span>
                  </button>
                  <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">KATILIMCI:</span>
                    <span className="text-lg font-black text-white">{quiz.participant_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link to={`/quiz/${quiz.id}/questions`} className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 text-center">
                  SORULAR
                </Link>
                
                {quiz.status === 'completed' ? (
                  <Link to={`/quiz-results/${quiz.id}`} className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-[#30A138] text-white font-black text-xs uppercase tracking-widest hover:bg-[#25822b] transition-all shadow-lg shadow-[#30A138]/20 text-center">
                    SONUÇLAR
                  </Link>
                ) : quiz.status === 'active' ? (
                  <Link to={`/play-quiz/${quiz.id}?host=true`} className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-center">
                    DEVAM ET
                  </Link>
                ) : quiz.question_count > 0 ? (
                  <Link to={`/quiz/${quiz.id}/lobby`} className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-[#30A138] text-white font-black text-xs uppercase tracking-widest hover:bg-[#25822b] transition-all shadow-lg shadow-[#30A138]/20 text-center">
                    BAŞLAT
                  </Link>
                ) : (
                  <button 
                    onClick={() => showNotify('error', 'Yarışmayı başlatmak için en az 1 soru eklemelisiniz!')}
                    className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-[#30A138]/50 text-white/50 font-black text-xs uppercase tracking-widest cursor-not-allowed text-center border border-[#30A138]/20"
                  >
                    BAŞLAT
                  </button>
                )}

                <button 
                  onClick={() => setShowDeleteModal(quiz.id)}
                  className="p-3.5 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-600/20 group/del"
                  title="Quizi Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover/del:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {quizzes.length === 0 && (
          <div className="card text-center py-24 flex flex-col items-center bg-white/5 border-dashed border-white/10">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 text-5xl">⚡</div>
            <h3 className="text-2xl font-black text-white mb-2">HENÜZ YARIŞMAN YOK</h3>
            <p className="text-gray-500 mb-10 max-w-xs font-medium">Hemen ilk yarışmanı oluştur ve öğrencilerini eğlenceye davet et!</p>
            <Link to="/create-quiz" className="btn-primary px-10 py-5">
              İLK QUİZİNİ OLUŞTUR
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
