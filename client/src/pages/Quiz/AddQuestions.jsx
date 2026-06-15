import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import * as XLSX from 'xlsx';

export default function AddQuestions() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [globalTimeLimit, setGlobalTimeLimit] = useState(20);
  const [updatingTime, setUpdatingTime] = useState(false);
  const [form, setForm] = useState({
    question_text: '',
    image_url: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    order_index: 0
  });
  const [toast, setToast] = useState({ msg: '', type: 'error' });
  const [timeUpdateSuccess, setTimeUpdateSuccess] = useState(false);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'error' }), 3000);
  };
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [quizStatus, setQuizStatus] = useState('draft');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setForm(prev => ({ ...prev, image_url: data.fileUrl }));
      } else {
        setError(data.message || 'Resim yuklenemedi');
      }
    } catch (err) {
      setError('Resim yuklenirken hata olustu');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await apiGet(`/quiz/${quizId}/questions`);
        if (data.success) {
          setQuestions(data.questions);
          setForm(prev => ({ ...prev, order_index: data.questions.length }));
          if (data.questions.length > 0) {
            setGlobalTimeLimit(data.questions[0].time_limit || 20);
          }
        }
      } catch (err) {
        console.error('Sorular getirilemedi:', err);
      }
    };

    const fetchQuizInfo = async () => {
      try {
        const data = await apiGet(`/quiz/info/${quizId}`);
        if (data.success) {
          setQuizStatus(data.quiz.status);
        }
      } catch (err) {
        console.error('Quiz bilgisi getirilemedi:', err);
      }
    };

    fetchQuestions();
    fetchQuizInfo();
  }, [quizId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      const payload = { ...form, time_limit: globalTimeLimit };
      if (editingQuestionId) {
        data = await apiPut(`/quiz/${quizId}/questions/${editingQuestionId}`, payload);
      } else {
        data = await apiPost(`/quiz/${quizId}/questions`, payload);
      }

      if (data.success) {
        const updated = await apiGet(`/quiz/${quizId}/questions`);
        if (updated.success) {
          setQuestions(updated.questions);
          setForm({
            question_text: '',
            image_url: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_option: 'A',
            order_index: updated.questions.length
          });
          setEditingQuestionId(null);
        }
      }
    } catch (err) {
      setError(err.message || (editingQuestionId ? 'Soru guncellenirken hata olustu.' : 'Soru eklenirken hata olustu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (q) => {
    setForm({
      question_text: q.question_text,
      image_url: q.image_url || '',
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      order_index: q.order_index
    });
    setEditingQuestionId(q.id);
    // Smooth scroll to the form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setForm({
      question_text: '',
      image_url: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      order_index: questions.length
    });
  };

  const handleDeleteQuestion = async (qId) => {
    try {
      const res = await apiDelete(`/quiz/${quizId}/questions/${qId}`);
      if (res.success) {
        setQuestions(questions.filter(q => q.id !== qId));
        setDeletingId(null);
        if (editingQuestionId === qId) {
          cancelEdit();
        }
      }
    } catch (err) {
      showToast('Soru silinirken hata oluştu: ' + (err.message || err));
    }
  };

  const updateAllTimeLimits = async () => {
    const timeVal = parseInt(globalTimeLimit);
    if (isNaN(timeVal) || timeVal < 5) {
      showToast('Lütfen en az 5 saniye olacak şekilde geçerli bir süre girin.');
      return;
    }
    setUpdatingTime(true);
    try {
      const res = await apiPut(`/quiz/${quizId}/questions/time-limit`, { time_limit: timeVal });
      if (res.success) {
        setTimeUpdateSuccess(true);
        setTimeout(() => setTimeUpdateSuccess(false), 2000);
        const data = await apiGet(`/quiz/${quizId}/questions`);
        if (data.success) setQuestions(data.questions);
      }
    } catch (err) {
      showToast('Süre güncellenirken hata oluştu.');
    } finally {
      setUpdatingTime(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { codepage: 65001 });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsedQuestions = rawJson.map((row, idx) => {
        const getVal = (keyStr) => {
          const key = Object.keys(row).find(k => k.trim().toLowerCase() === keyStr);
          return key ? row[key].toString().trim() : '';
        };

        let correct = getVal('cevap')?.toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(correct)) correct = 'A';

        return {
          question_text: getVal('soru') || 'Soru',
          option_a: getVal('a') || '-',
          option_b: getVal('b') || '-',
          option_c: getVal('c') || '-',
          option_d: getVal('d') || '-',
          correct_option: correct,
          time_limit: parseInt(globalTimeLimit) || 20,
          order_index: questions.length + idx
        };
      }).filter(q => q.question_text !== 'Soru' || q.option_a !== '-' || q.option_b !== '-'); // Sadece tam boş satırları atla

      if (parsedQuestions.length === 0) {
        showToast('Dosyadan geçerli soru bulunamadı. Kolon isimlerini (soru, a, b, c, d, cevap) kontrol edin.');
        return;
      }

      const res = await apiPost(`/quiz/${quizId}/questions/bulk`, { questions: parsedQuestions });
      if (res.success) {
        setBulkUploadSuccess(true);
        setTimeout(() => setBulkUploadSuccess(false), 3000);
        const qData = await apiGet(`/quiz/${quizId}/questions`);
        if (qData.success) {
          setQuestions(qData.questions);
          setForm(prev => ({ ...prev, order_index: qData.questions.length }));
        }
      }
    } catch (err) {
      showToast(`Toplu soru eklenirken hata oluştu: ${err.message || err}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (quizStatus === 'completed') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-bounce-in">
        <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
          <span className="text-5xl">🔒</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">BU YARIŞMA TAMAMLANDI</h1>
        <p className="text-gray-400 mb-10 max-w-lg mx-auto font-medium leading-relaxed">
          Tamamlanmış bir yarışmanın soruları üzerinde düzenleme yapılamaz. Soruları ve öğrenci performanslarını görüntülemek için istatistikler sayfasına gidebilirsiniz.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/my-quizzes" className="btn-secondary px-8 py-4">Geri Dön</Link>
          <Link to={`/quiz/${quizId}/stats`} className="btn-primary px-8 py-4 flex items-center justify-center gap-2">
            İSTATİSTİKLERİ GÖR
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast.msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] ${toast.type === 'success' ? 'bg-[#30A138]' : 'bg-red-600'} text-white px-6 py-3 rounded-full shadow-lg font-black uppercase tracking-widest text-sm animate-bounce-in whitespace-nowrap pointer-events-none border border-white/20`}>
          {toast.msg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Sorulari Duzenle</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link to="/my-quizzes" className="btn-secondary text-center">
            Taslak Olarak Kaydet ve Cik
          </Link>
          <Link to={`/quiz/${quizId}/lobby`} className="btn-success text-center">
            Lobiye Git ve Baslat
          </Link>
        </div>
      </div>

      {/* Global Settings & Bulk Upload */}
      <div className="card mb-8">
        <h3 className="font-bold text-white mb-4 border-b border-[#333] pb-2">Toplu İşlemler ve Ayarlar</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Global Time Setting */}
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-[#333]">
            <h4 className="font-semibold text-sm mb-2 text-gray-300">Tüm Sorular İçin Süre</h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input-field w-20 mb-0 py-2 px-3"
                value={globalTimeLimit}
                onChange={(e) => setGlobalTimeLimit(e.target.value)}
                min={5} max={120}
              />
              <span className="text-sm text-gray-400">saniye</span>
              <button
                onClick={updateAllTimeLimits}
                disabled={updatingTime}
                className={`${timeUpdateSuccess ? 'bg-green-600' : 'bg-[#30A138] hover:bg-[#25822b]'} text-white font-bold py-2 px-4 rounded text-xs ml-auto transition-all flex items-center gap-2`}
              >
                {updatingTime ? 'Uygulanıyor...' : timeUpdateSuccess ? '✓ Uygulandı' : 'Tümüne Uygula'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Bu süre hem mevcut sorulara uygulanır hem de yeni eklenecek sorular için varsayılan olur.</p>
          </div>

          {/* Bulk Upload */}
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-[#30A138]/30">
            <h4 className="font-semibold text-sm mb-2 text-[#30A138]">Toplu Soru Yükle (Excel/CSV)</h4>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#30A138]/10 file:text-[#30A138]
                    hover:file:bg-[#30A138]/20"
                onChange={handleBulkUpload}
                ref={fileInputRef}
              />
              {bulkUploadSuccess && <span className="text-green-500 font-bold text-xs animate-bounce-in ml-2 shrink-0">✓ Eklendi</span>}
            </div>
            <p className="text-xs text-[#30A138]/80 mt-2">Sütun başlıkları: <b>soru, a, b, c, d, cevap</b> olmalıdır. (Büyük/küçük harf duyarsızdır)</p>
          </div>
        </div>
      </div>

      {/* Soru Listesi */}
      <div className="space-y-3 mb-8">
        <h3 className="font-bold text-gray-300">Mevcut Sorular ({questions.length})</h3>
        {questions.map((q, idx) => (
          <div key={q.id} className="card py-4 relative">
            <p className="font-bold mb-3 text-white">{idx + 1}. {q.question_text}</p>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <span className={q.correct_option === 'A' ? 'text-[#30A138] font-bold' : 'text-gray-400'}>A) {q.option_a}</span>
              <span className={q.correct_option === 'B' ? 'text-[#30A138] font-bold' : 'text-gray-400'}>B) {q.option_b}</span>
              <span className={q.correct_option === 'C' ? 'text-[#30A138] font-bold' : 'text-gray-400'}>C) {q.option_c}</span>
              <span className={q.correct_option === 'D' ? 'text-[#30A138] font-bold' : 'text-gray-400'}>D) {q.option_d}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                Süre: <span className="text-gray-300">{q.time_limit}s</span> | Puan: <span className="text-gray-300">{q.points || 100}</span>
              </p>

              <div className="flex gap-2">
                {deletingId === q.id ? (
                  <div className="flex items-center gap-1 bg-red-600/20 border border-red-600/40 p-1 rounded-lg animate-bounce-in">
                    <span className="text-[9px] text-red-500 font-black px-1 uppercase tracking-tighter">EMİN MİSİNİZ?</span>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="bg-red-600 text-white px-2 py-1 rounded font-black text-[9px] uppercase hover:bg-red-700 transition-colors">SİL</button>
                    <button onClick={() => setDeletingId(null)} className="bg-white/10 text-white px-2 py-1 rounded font-black text-[9px] uppercase hover:bg-white/20 transition-colors">VAZGEÇ</button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(q)}
                      className="text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Duzenle
                    </button>
                    <button
                      onClick={() => setDeletingId(q.id)}
                      className="text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Sil
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-gray-400 text-sm">Henuz soru eklenmedi. Asagidan ilk sorunuzu ekleyin.</p>
        )}
      </div>

      {/* Soru Ekleme Formu */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{editingQuestionId ? 'Soruyu Duzenle' : 'Yeni Soru Ekle'}</h3>
          {editingQuestionId && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white border border-[#333] hover:bg-[#333] px-2 py-1 rounded transition-colors">
              Iptal
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Soru Metni</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Resim Ekle (Opsiyonel)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input-field w-1/3"
                disabled={uploadingImage}
              />
              <input
                type="url"
                className="input-field flex-1"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="Veya URL yapistirin (or: https://resim.com/a.jpg)"
              />
            </div>
            {uploadingImage && <p className="text-sm text-blue-500 mt-1">Resim yukleniyor, lutfen bekleyin...</p>}
            {form.image_url && (
              <div className="mt-2">
                <img src={form.image_url} alt="Soru Resmi" className="h-24 object-contain rounded border border-gray-200" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Secenek A</label>
              <input
                type="text"
                className="input-field"
                value={form.option_a}
                onChange={(e) => setForm({ ...form, option_a: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Secenek B</label>
              <input
                type="text"
                className="input-field"
                value={form.option_b}
                onChange={(e) => setForm({ ...form, option_b: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Secenek C</label>
              <input
                type="text"
                className="input-field"
                value={form.option_c}
                onChange={(e) => setForm({ ...form, option_c: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Secenek D</label>
              <input
                type="text"
                className="input-field"
                value={form.option_d}
                onChange={(e) => setForm({ ...form, option_d: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Dogru Cevap</label>
              <select
                className="input-field"
                value={form.correct_option}
                onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (editingQuestionId ? 'Guncelleniyor...' : 'Ekleniyor...') : (editingQuestionId ? 'Guncelle' : 'Soru Ekle')}
          </button>
        </form>
      </div>
    </div>
  );
}
