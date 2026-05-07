import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/auth/register', form);
      if (data.success) {
        login(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Kayit sirasinda hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-[#111] border border-white/5 shadow-2xl p-10">
        <h1 className="text-3xl font-black text-center mb-6 text-white tracking-tighter italic uppercase">Kayıt Ol</h1>
        <p className="text-sm text-gray-500 text-center mb-8 font-medium">
          Ortak çalışma panoları oluşturmak ve yarışmalar düzenlemek için hesap oluşturun.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ad Soyad</label>
            <input
              type="text"
              className="input-field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Sifre</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>



          <button type="submit" className="w-full bg-[#30A138] text-white py-4 rounded-xl text-lg font-black shadow-lg shadow-[#30A138]/20 active:scale-95 transition-all hover:bg-[#25822b] mt-4 uppercase tracking-widest" disabled={loading}>
            {loading ? 'Kayıt yapılıyor...' : 'KAYIT OL'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Zaten hesabiniz var mi?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Giris Yapin
          </Link>
        </p>
      </div>
    </div>
  );
}
