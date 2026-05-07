import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../lib/api';

export default function CreateQuiz() {
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/quiz/create', form);
      if (data.success) {
        navigate(`/quiz/${data.quiz.id}/questions`);
      }
    } catch (err) {
      setError(err.message || 'Quiz olusturulurken hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Yeni Quiz Olustur</h1>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Quiz Basligi</label>
            <input
              type="text"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Orn: Tarih Testi - 1. Unite"
              required
            />
          </div>

          <div>
            <label className="label">Aciklama (Opsiyonel)</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Quiz hakkinda kisa bilgi..."
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Olusturuluyor...' : 'Olustur ve Sorulari Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
}
