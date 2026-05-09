import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function JoinQuiz() {
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiGet(`/quiz/join/${pin.toUpperCase()}`);
      if (data.success) {
        // PIN ve nickname'i sessionStorage'a kaydet (play quiz icin)
        sessionStorage.setItem('quiz_pin', pin.toUpperCase());
        sessionStorage.setItem('quiz_nickname', nickname);
        sessionStorage.setItem('quiz_id', data.quiz.id);
        
        navigate(`/play-quiz/${data.quiz.id}`);
      }
    } catch (err) {
      setError(err.message || 'Gecersiz PIN kodu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-2">Yarismaya Katil</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Arkadasinizin veya yoneticinin verdigi PIN kodunu ve bir takma ad girin.
          <br />
          <span className="text-blue-600 font-medium">Kayit olmaniza gerek yok!</span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">PIN Kodu</label>
            <input
              type="text"
              className="input-field text-center text-xl sm:text-2xl tracking-widest font-bold uppercase"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
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
              placeholder="Ornek: SuperKullanici42"
              maxLength={20}
              required
            />
          </div>

          <button type="submit" className="btn-success w-full py-3 text-lg" disabled={loading}>
            {loading ? 'Kontrol ediliyor...' : 'Katil'}
          </button>
        </form>
      </div>
    </div>
  );
}
