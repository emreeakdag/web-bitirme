import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, isTeacher, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  
  const linkBase = "text-xs font-bold uppercase tracking-wider transition-all duration-300 relative py-2";
  const getLinkClass = (path) => {
    return `${linkBase} ${isActive(path) ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#30A138]' : 'text-gray-400 hover:text-white'}`;
  };

  return (
    <nav className="bg-[#1c1c1c] border-b border-[#333333] sticky top-0 z-50 shadow-sm w-full">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center gap-12">
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <svg className="w-8 h-8 text-[#30A138]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9L4 10.63L4 17C4 18.66 7.58 20 12 20C16.42 20 20 18.66 20 17V10.63L23 9L12 3ZM12 18C8.69 18 6 16.88 6 15.5C6 14.12 8.69 13 12 13C15.31 13 18 14.12 18 15.5C18 16.88 15.31 18 12 18ZM12 11.08L4.25 7.64L12 4.21L19.75 7.64L12 11.08Z"/></svg>
              Vibe Learn
            </Link>
            
            {isAuthenticated && isTeacher && (
              <div className="hidden lg:flex gap-8 items-center">
                <Link to="/my-quizzes" className={getLinkClass('/my-quizzes')}>
                  Yarışmalarım
                </Link>
                <Link to="/create-quiz" className={getLinkClass('/create-quiz')}>
                  Quiz Oluştur
                </Link>
                <Link to="/my-boards" className={isActive('/my-boards') || isActive('/joined-boards') ? getLinkClass('/my-boards') : getLinkClass('/my-boards').replace("text-black after", "text-gray-400 hover:text-black")}>
                  Panolarım
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/join-board" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider">
                Panoya Katıl
              </Link>
              <Link to="/join-quiz" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider">
                Yarışmaya Katıl
              </Link>

              {!isAuthenticated ? (
                <div className="flex gap-4 items-center ml-4 border-l border-[#333333] pl-6">
                  <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider">
                    Giriş
                  </Link>
                  <Link to="/register" className="btn-primary py-2.5 px-6">
                    Kayıt Ol
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4 ml-4 border-l border-[#333333] pl-6">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {user.full_name}
                  </span>
                  <button 
                    onClick={() => { logout(); navigate('/'); }}
                    className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider"
                  >
                    Çıkış
                  </button>
                </div>
              )}
            </div>

            <button 
              className="lg:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6 space-y-4">
            {isAuthenticated && isTeacher && (
              <div className="flex flex-col gap-4 pb-4 border-b border-[#333333]">
                <span className="text-xs font-bold text-[#30A138] uppercase tracking-wider">
                  HOŞ GELDİN, {user.full_name}
                </span>
                <Link to="/my-quizzes" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                  Yarışmalarım
                </Link>
                <Link to="/create-quiz" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                  Quiz Oluştur
                </Link>
                <Link to="/my-boards" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                  Panolarım
                </Link>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              <Link to="/join-board" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                Panoya Katıl
              </Link>
              <Link to="/join-quiz" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                Yarışmaya Katıl
              </Link>
              
              {!isAuthenticated ? (
                <div className="flex flex-col gap-3 pt-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                    Giriş
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary text-center py-3">
                    Kayıt Ol
                  </Link>
                </div>
              ) : (
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/'); }}
                  className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors text-left pt-2"
                >
                  Çıkış
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
