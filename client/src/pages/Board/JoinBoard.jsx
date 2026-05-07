import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function JoinBoard() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiGet(`/board/join-public/${code.toUpperCase()}`);
      if (data.success) {
        // PIN ve nickname'i sessionStorage'a kaydet (anonim kullanim icin)
        sessionStorage.setItem('board_code', code.toUpperCase());
        sessionStorage.setItem('board_nickname', nickname);
        sessionStorage.setItem('board_id', data.board.id);
        
        navigate(`/board/${data.board.id}`);
      }
    } catch (err) {
      setError(err.message || 'Pano bulunamadi veya pasif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-[#111] border border-white/5 shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#30A138]/20 rounded-full flex items-center justify-center border border-[#30A138]/30">
            <span className="text-3xl">🔑</span>
          </div>
        </div>
        <h1 className="text-3xl font-black text-white text-center mb-2 uppercase italic tracking-tighter">PANOYA KATIL</h1>
        <p className="text-sm text-gray-500 text-center mb-8 font-medium">
          Arkadaşınızın veya yöneticinin verdiği kodu girin. <br />
          <span className="text-[#30A138] font-bold block mt-1">Kayıt olmanıza gerek yok!</span>
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="label">Pano Kodu</label>
            <input
              type="text"
              className="input-field text-center text-2xl tracking-widest font-bold uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 8))}
              placeholder="ABC12345"
              maxLength={8}
              required
            />
          </div>

          <div>
            <label className="label">Nickname (Takma Ad)</label>
            <input
              type="text"
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="Ornek: CizimUstasi"
              maxLength={20}
              required
            />
          </div>

          <button type="submit" className="w-full bg-[#30A138] text-white py-4 rounded-xl text-lg font-black shadow-lg shadow-[#30A138]/20 active:scale-95 transition-all hover:bg-[#25822b] mt-4 uppercase tracking-widest" disabled={loading}>
            {loading ? 'SİNYAL BEKLENİYOR...' : 'PANOYA GİRİŞ YAP'}
          </button>
        </form>
      </div>
    </div>
  );
}
