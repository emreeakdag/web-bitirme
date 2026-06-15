import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const subjects = [
  {
    id: 'chemistry',
    svg: (
      <svg className="w-72 h-72 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Beaker */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        {/* Bubbles */}
        <circle cx="10" cy="14" r="1.5" className="animate-bubble-1" fill="currentColor" strokeWidth="0" />
        <circle cx="14" cy="12" r="2" className="animate-bubble-2" fill="currentColor" strokeWidth="0" />
        <circle cx="12" cy="16" r="1.5" className="animate-bubble-3" fill="currentColor" strokeWidth="0" />
      </svg>
    )
  },
  {
    id: 'biology',
    svg: (
      <div className="w-56 h-72 flex flex-col justify-between items-center py-2" style={{ perspective: '800px' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-full h-1 relative animate-dna-spin-rung"
            style={{
              animationDelay: `-${i * 0.25}s`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* The rung line */}
            <div className="absolute top-1/2 left-0 w-full h-[4px] bg-white/30 -translate-y-1/2" />

            {/* Left Node */}
            <div
              className="absolute top-1/2 left-0 w-6 h-6 rounded-full shadow-lg"
              style={{
                backgroundColor: i % 2 === 0 ? '#6ee7b7' : '#a7f3d0',
                transform: 'translate(-50%, -50%) translateZ(4px)'
              }}
            />
            {/* Right Node */}
            <div
              className="absolute top-1/2 right-0 w-6 h-6 rounded-full shadow-lg"
              style={{
                backgroundColor: i % 2 === 0 ? '#a7f3d0' : '#6ee7b7',
                transform: 'translate(50%, -50%) translateZ(-4px)'
              }}
            />
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'coding',
    svg: (
      <svg className="w-72 h-72 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Laptop Outline */}
        <rect x="2" y="5" width="20" height="12" rx="1.5" strokeWidth="1.5" />
        <path d="M1 17h22l1 2H0l1-2z" fill="currentColor" strokeWidth="0" />
        <rect x="10" y="17.5" width="4" height="0.5" fill="#fff" strokeWidth="0" />

        {/* Typing code */}
        <g className="animate-typewriter" style={{ clipPath: 'inset(0 100% 0 0)' }}>
          <text x="4" y="11.5" fill="currentColor" strokeWidth="0" fontSize="1.4" fontFamily="monospace" fontWeight="bold">
            print("Vibe Learn")
          </text>
        </g>
        {/* Moving Cursor */}
        <g className="animate-cursor-move">
          <rect x="4" y="10.2" width="0.6" height="1.6" fill="currentColor" className="animate-blink" strokeWidth="0" />
        </g>
      </svg>
    )
  },
  {
    id: 'physics',
    svg: (
      <svg className="w-72 h-72 text-white/40 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="2.5" fill="currentColor" strokeWidth="0" />
        <ellipse cx="12" cy="12" rx="10" ry="4" strokeWidth="1.5" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" strokeWidth="1.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" strokeWidth="1.5" transform="rotate(120 12 12)" />
      </svg>
    )
  }
];

export default function Home() {
  const { isAuthenticated, isTeacher, isStudent } = useAuth();
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Hero Section */}
      <div className="flex items-center gap-6 md:gap-16 mb-20 md:mb-32">
        <div className="flex-1 space-y-4 md:space-y-8 min-w-[55%]">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-[#30A138] uppercase tracking-widest mb-2 md:mb-4">Eğitimi Yeniden Tanımlıyoruz</p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Vibe Learn ile<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#30A138] to-teal-400">
                İnteraktif Öğrenme.
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md leading-relaxed hidden sm:block">
            Öğretmenler ve öğrenciler için etkileşimli, anlık geri bildirimli ve kayıt gerektirmeyen modern eğitim platformu. Sınıfınızı dijitalleştirin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-4 w-full pr-4 sm:pr-0">
            <Link to="/join-quiz" className="btn-primary text-[10px] md:text-xs py-2 md:py-3 px-3 sm:px-6 w-full sm:w-auto text-center">
              YARIŞMAYA KATIL
            </Link>
            <Link to="/join-board" className="btn-secondary text-[10px] md:text-xs py-2 md:py-3 px-3 sm:px-6 w-full sm:w-auto text-center">
              PANOYA KATIL
            </Link>
          </div>
        </div>
        <div className="flex-1 w-full max-w-[140px] sm:max-w-md md:max-w-lg aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0">
          {subjects.map((subject, idx) => (
            <div
              key={subject.id}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 transform ${idx === currentSubjectIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                }`}
            >
              <div className="scale-[0.4] sm:scale-75 md:scale-100 flex items-center justify-center w-full h-full">
                {subject.svg}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Neden Vibe Learn?</h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-[#30A138] to-teal-400 mx-auto mt-6 rounded-full"></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
        <div className="card h-full">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-[#30A138]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-3">Anında Katılım</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Öğrenciler hiçbir üyelik veya hesap gerektirmeden sadece QR kod veya PIN kodu ile yarışmalara saniyeler içinde katılabilir.
          </p>
        </div>
        <div className="card h-full">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-6 h-6 text-[#30A138]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-3">Gerçek Zamanlı Rekabet</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Kahoot tarzı interaktif yarışmalarla sınıf içi dinamizmi artırın.
          </p>
          <ul className="space-y-3 text-xs uppercase font-bold text-gray-300 tracking-wider">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#30A138]"></span> Canlı Liderlik Tablosu</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#30A138]"></span> Otomatik İlerleme</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#30A138]"></span> Skor Takibi</li>
          </ul>
        </div>
        <div className="card h-full">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-[#30A138]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-3">Veriye Dayalı Analiz</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Hangi soruların daha çok zorladığını görün, eksik konuları anında tespit edin ve müfredatınızı geliştirin.
          </p>
        </div>
        <div className="card h-full">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-6 h-6 text-[#30A138]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-3">Ortak Çalışma Panoları</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Padlet benzeri ortak panolar oluşturun. Öğrenciler anonim olarak veya isimleriyle fikir, resim ve dosya paylaşsın.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="card border-[#333333] py-24 text-center max-w-4xl mx-auto bg-gradient-to-b from-[#232323] to-[#1c1c1c] shadow-xl">
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Hazır mısınız?</h2>
        <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
          Öğrencilerinizle daha modern, hızlı ve odaklı bir eğitim deneyimi yaşamak için hemen başlayın.
        </p>
        {!isAuthenticated ? (
          <Link to="/register" className="btn-primary">
            HEMEN KAYIT OL
          </Link>
        ) : isTeacher ? (
          <Link to="/create-quiz" className="btn-primary">
            YENİ İÇERİK OLUŞTUR
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/joined-quizzes" className="btn-primary">
              YARIŞMALARIM
            </Link>
            <Link to="/joined-boards" className="btn-secondary">
              PANOLARIM
            </Link>
          </div>
        )}
      </div>

      {/* Footer Area padding */}
      <div className="pt-32 border-t border-[#333333] mt-32 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
        <div>
          <span className="text-white text-sm font-extrabold">Vibe Learn</span>
          <br className="mt-2" />
          © 2024 VIBE LEARN. TÜM HAKLARI SAKLIDIR.
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">GİZLİLİK</a>
          <a href="#" className="hover:text-white transition-colors">ŞARTLAR</a>
          <a href="#" className="hover:text-white transition-colors">İLETİŞİM</a>
        </div>
      </div>
    </div>
  );
}
