import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import LoginModal from './components/LoginModal';
import useUser from './components/useUser';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Coaching from './pages/Coaching';
import Notes from './pages/Notes';
import Stats from './pages/Stats';
import Guide from './pages/Guide';
import Workbook from './pages/Workbook';

export default function App() {
  const { user, setUser, signOut } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);
  const location = useLocation();

  // 페이지 전환 시 상단으로 (iOS 내비게이션 느낌)
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  // 다른 페이지에서 로그인 요청 (예: 대시보드 로그아웃 상태 CTA)
  useEffect(() => {
    const open = () => setLoginOpen(true);
    window.addEventListener('rg-open-login', open);
    return () => window.removeEventListener('rg-open-login', open);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogin={() => setLoginOpen(true)} onLogout={signOut} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/workbook" element={<Workbook />} />
        </Routes>
      </main>
      <TabBar user={user} onLogin={() => setLoginOpen(true)} onLogout={signOut} />
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={(u) => { setUser(u); setLoginOpen(false); }}
      />
    </div>
  );
}
