import { NavLink, useLocation } from 'react-router-dom';
import { BookMarked, LogIn, LogOut, User } from 'lucide-react';
import { NAV } from './nav';

/** 데스크톱 사이드바 — macOS 소스 리스트 스타일 */
export default function Sidebar({ user, onLogin, onLogout }) {
  const location = useLocation();

  return (
    <aside className="sidebar" aria-label="주 메뉴">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><BookMarked size={18} strokeWidth={2.2} /></div>
        <div>
          <div className="sidebar-brand-name">리딩 자이언트</div>
          <div className="sidebar-brand-sub">AI 독서 코치</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, idx) => {
          if (item.section) {
            return <div key={`s-${idx}`} className="sidebar-section">{item.section}</div>;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} id={item.id} className={`sidebar-item ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined}>
              <Icon className="sidebar-item-icon" strokeWidth={1.9} />
              <span className="sidebar-item-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user">
            <div className="avatar"><User size={16} /></div>
            <div className="flex-1">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-sub">{user.email}</div>
            </div>
            <button className="btn btn-ghost muted btn-icon btn-sm" onClick={onLogout} title="로그아웃" aria-label="로그아웃">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="sidebar-item" onClick={onLogin} id="sidebar-login-btn">
            <LogIn className="sidebar-item-icon" strokeWidth={1.9} />
            <span className="sidebar-item-text">로그인 / 가입</span>
          </button>
        )}
        <div className="sidebar-credit">거인의 노트 · 김익환<br />AI 5단계 독서법 기반</div>
      </div>
    </aside>
  );
}
