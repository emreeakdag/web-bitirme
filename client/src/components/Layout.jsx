import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  // Board detay sayfası veya public board linki ise tam genişlik (arka plan için)
  const isBoardDetail = location.pathname.startsWith('/board/');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={isBoardDetail ? "flex-grow flex flex-col w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow"}>
        <Outlet />
      </main>
    </div>
  );
}
