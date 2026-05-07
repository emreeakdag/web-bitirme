import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function JoinedBoards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await apiGet('/board/joined-boards');
        if (data.success) {
          setBoards(data.boards);
        }
      } catch (err) {
        console.error('Panolar getirilemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">KATILDIĞIM PANOLAR</h1>
          <div className="h-1 w-20 bg-[#30A138] mt-1 rounded-full"></div>
        </div>
        <Link to="/join-board" className="btn-primary">
          + Yeni Pano Bul
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div key={board.id} className="card group bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-black text-2xl mb-3 text-white group-hover:text-[#30A138] transition-colors">{board.title}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed italic font-medium">{board.description || 'Açıklama belirtilmemiş.'}</p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Oluşturan:</span>
                <span className="font-bold text-[#30A138] text-xs uppercase tracking-wider">{board.teacher_name}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">İÇERİK SAYISI</span>
                <span className="text-lg font-black text-white">{board.post_count}</span>
              </div>
              <Link to={`/board/${board.id}`} className="btn-secondary w-full text-center block text-xs tracking-widest py-3">
                PANOYA GİT
              </Link>
            </div>
          </div>
        ))}
        
        {boards.length === 0 && (
          <div className="card col-span-full text-center py-24 flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-6 font-medium">Henüz bir panoya katılmadınız.</p>
            <Link to="/join-board" className="btn-primary">
              Pano Bulun
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
