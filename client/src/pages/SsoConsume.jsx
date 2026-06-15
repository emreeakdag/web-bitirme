import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function SsoConsume() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('Oturum aktarılıyor...');

  useEffect(() => {
    const token = searchParams.get('token');

    const consume = async () => {
      if (!token) {
        setMessage('SSO token bulunamadı.');
        return;
      }

      try {
        setMessage('Oturum doğrulanıyor...');
        const response = await fetch(`${API_BASE_URL}/auth/sso`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || data?.message || `SSO doğrulanamadı (${response.status}).`);
        }

        if (!data?.token || !data?.user) {
          throw new Error('SSO yanıtı eksik geldi. token veya user bulunamadı.');
        }

        login(data.token, data.user);
        navigate('/', { replace: true });
        return;
      } catch (error) {
        setMessage(error?.message || 'SSO doğrulanamadı.');
      }
    };

    if (!authLoading) {
      consume();
    }
  }, [authLoading, login, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4">
      <div className="max-w-md w-full card bg-white/5 border border-white/10 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-400/15 flex items-center justify-center text-2xl">
          ↗
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight uppercase">VibeLearn</h1>
        <p className="mt-3 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
