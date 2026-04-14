import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Sparkles, PenTool, BarChart3, 
  Settings, Menu, X, Library, BookMarked, ClipboardList, LogIn, User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout, onAuthStateChange } from '../data/store';
import LoginModal from './LoginModal';

const navItems = [
  { label: '메뉴', type: 'section' },
  { path: '/', icon: LayoutDashboard, label: '대시보드', id: 'nav-dashboard' },
  { path: '/library', icon: Library, label: '내 서재', id: 'nav-library' },
  { path: '/coaching', icon: Sparkles, label: 'AI 독서 코칭', id: 'nav-coaching', badge: '5단계' },
  { path: '/workbook', icon: ClipboardList, label: '책 해부 워크북', id: 'nav-workbook', badge: 'NEW' },
  { path: '/notes', icon: PenTool, label: '기록 노트', id: 'nav-notes' },
  { path: '/stats', icon: BarChart3, label: '성장 통계', id: 'nav-stats' },
  { label: '도움말', type: 'section' },
  { path: '/guide', icon: BookMarked, label: '독서법 가이드', id: 'nav-guide' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check current user state immediately
    getCurrentUser().then(u => {
      setUser(u ? { ...u, name: u.user_metadata?.full_name || u.email.split('@')[0] } : null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, sessionUser) => {
      console.log('Auth state change:', event, sessionUser);
      setUser(sessionUser ? { ...sessionUser, name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0] } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">
            <BookMarked size={20} className="text-indigo-400" />
          </div>
          <span className="sidebar-logo-text">리딩 자이언트</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="메뉴 열기"
          id="mobile-menu-toggle"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="mobile-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BookMarked size={22} />
          </div>
          <div>
            <div className="sidebar-logo-text">리딩 자이언트</div>
            <div className="sidebar-logo-sub">AI 독서 코치</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.type === 'section') {
              return (
                <div key={idx} className="sidebar-section-label">
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                id={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="sidebar-item-icon" size={20} />
                <span className="sidebar-item-text">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-item-badge">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3" style={{ padding: 'var(--space-2) var(--space-1)' }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: 'var(--amber-glow)', color: 'var(--amber-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <User size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>정식 회원</div>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{ fontSize: '10px', color: 'var(--rose-400)', padding: '4px' }}
                >
                  로그아웃
                </button>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>시스템 기반</div>
                <div>거인의 노트 - 김익환</div>
                <div>AI 5단계 독서 솔루션</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                className="btn btn-ghost w-full" 
                style={{ justifyContent: 'flex-start', padding: 'var(--space-2) var(--space-3)', color: 'var(--indigo-400)' }}
                onClick={() => setIsLoginModalOpen(true)}
              >
                <LogIn size={18} style={{ marginRight: '10px' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>로그인 / 가입</span>
              </button>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>시스템 기반</div>
                <div>거인의 노트 - 김익환</div>
                <div>AI 5단계 독서 솔루션</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={(u) => {
          setUser(u);
          setIsLoginModalOpen(false);
        }}
      />
    </>
  );
}
