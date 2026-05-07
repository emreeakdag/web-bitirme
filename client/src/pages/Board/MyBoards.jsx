import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { BG_OPTIONS } from '../../lib/constants';

export default function MyBoards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', bg_image: 'default' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await apiGet('/board/my-boards');
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

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const data = await apiPost('/board/create', form);
      if (data.success) {
        setBoards([{ ...data.board, post_count: 0 }, ...boards]);
        setShowModal(false);
        setForm({ title: '', description: '', bg_image: 'default' });
      }
    } catch (err) {
      setError(err.message || 'Pano oluşturulurken hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleBoardStatus = async (board) => {
    try {
      const newValue = (board.is_active === 1 || board.is_active === true) ? 0 : 1;
      const data = await apiPut(`/board/${board.id}`, { is_active: newValue });
      if (data.success) {
        setBoards(prev => prev.map(b => b.id === board.id ? { ...b, is_active: newValue } : b));
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12 border-b border-[#333333] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ortak Çalışma Panolarım</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Yeni Pano Oluştur
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {boards.map((board) => (
          <div key={board.id} className={`card flex flex-col justify-between h-full transition-all ${!board.is_active ? 'opacity-75 grayscale-[0.3]' : ''}`}>
            <div>
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="font-extrabold text-xl tracking-tight text-white break-words">{board.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0 bg-[#1c1c1c] px-2 py-1 rounded-lg border border-[#333333]">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${board.is_active ? 'text-[#30A138]' : 'text-gray-500'}`}>
                    {board.is_active ? 'AKTİF' : 'PASİF'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleToggleBoardStatus(board)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${board.is_active ? 'bg-[#30A138]' : 'bg-gray-600'}`}
                    title={board.is_active ? 'Panoyu Kapat (Pasif)' : 'Panoyu Aç (Aktif)'}
                  >
                    <span 
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${board.is_active ? 'translate-x-[14px]' : 'translate-x-[2px]'}`}
                    />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed">{board.description}</p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-6 pb-4 border-b border-[#333333]">
                <span>Kod: <span className="text-white">{board.code}</span></span>
                <span>{board.post_count} İçerik</span>
              </div>
              <Link to={`/board/${board.id}`} className="btn-secondary w-full text-center block">
                Panoya Git
              </Link>
            </div>
          </div>
        ))}

        {boards.length === 0 && (
          <div className="card col-span-full text-center py-24 flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-6 font-medium">Henüz pano oluşturmadınız.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              İlk Panonuzu Oluşturun
            </button>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
          <div className="bg-[#232323] rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-[#333333] transform transition-all text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Yeni Pano Oluştur</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/30 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-5">
              <div>
                <label className="label">Pano Başlığı</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Biyoloji Dönem Ödevi"
                  required
                />
              </div>

              <div>
                <label className="label">Açıklama (Opsiyonel)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Pano hakkında kısa bir açıklama girin..."
                />
              </div>

              <div>
                <label className="label">Arka Plan Rengi</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {BG_OPTIONS.map(bg => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setForm({ ...form, bg_image: bg.id })}
                      className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${
                        form.bg_image === bg.id ? 'ring-4 ring-[#30A138] ring-offset-2 ring-offset-[#232323] scale-110 shadow-lg' : 'ring-1 ring-[#444444] hover:scale-105 hover:shadow-md'
                      }`}
                      title={bg.name}
                      style={{ backgroundColor: bg.color }}
                    >
                      {form.bg_image === bg.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className={`w-6 h-6 ${bg.isLight ? 'text-emerald-900' : 'text-white'} drop-shadow`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Oluşturuluyor...' : 'Pano Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
