import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Brain, FileText, BarChart3, 
  Settings, Menu, X, Library, BookMarked, ClipboardList 
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: '메뉴', type: 'section' },
  { path: '/', icon: LayoutDashboard, label: '대시보드', id: 'nav-dashboard' },
  { path: '/library', icon: Library, label: '내 서재', id: 'nav-library' },
  { path: '/coaching', icon: Brain, label: 'AI 독서 코칭', id: 'nav-coaching', badge: '5단계' },
  { path: '/workbook', icon: ClipboardList, label: '책 해부 워크북', id: 'nav-workbook', badge: 'NEW' },
  { path: '/notes', icon: FileText, label: '기록 노트', id: 'nav-notes' },
  { path: '/stats', icon: BarChart3, label: '성장 통계', id: 'nav-stats' },
  { label: '도움말', type: 'section' },
  { path: '/guide', icon: BookMarked, label: '독서법 가이드', id: 'nav-guide' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">📚</div>
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
          <div className="sidebar-logo-icon">📚</div>
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
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>기반 방법론</div>
            <div>📖 거인의 노트 - 김익환</div>
            <div>🤖 AI 5단계 독서법</div>
          </div>
        </div>
      </aside>
    </>
  );
}
