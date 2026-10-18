import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Ellipsis, LogIn, LogOut, User, ChevronRight, X } from 'lucide-react';
import { NAV_ITEMS } from './nav';

/** 모바일 하단 탭바 — iOS Tab Bar 스타일 (4개 주요 탭 + 더보기 시트) */
export default function TabBar({ user, onLogin, onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = NAV_ITEMS.filter(n => n.tab);
  const more = NAV_ITEMS.filter(n => !n.tab);
  const moreActive = more.some(m => m.path === location.pathname);

  const go = (path) => { setMoreOpen(false); navigate(path); };

  return (
    <>
      <nav className="tabbar" aria-label="하단 탭">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = location.pathname === t.path;
          return (
            <NavLink key={t.path} to={t.path} className={`tab-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon strokeWidth={active ? 2.2 : 1.8} />
              <span>{t.short || t.label}</span>
            </NavLink>
          );
        })}
        <button className={`tab-item ${moreActive || moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <Ellipsis strokeWidth={moreActive ? 2.2 : 1.8} />
          <span>더보기</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="modal-overlay" onClick={() => setMoreOpen(false)}>
          <div className="modal more-sheet" role="dialog" aria-label="더보기" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">더보기</h2>
              <button className="btn btn-ghost muted btn-icon" onClick={() => setMoreOpen(false)} aria-label="닫기"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="list">
                {more.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.path} className="list-row with-icon interactive" onClick={() => go(m.path)}>
                      <div className="list-icon"><Icon size={16} /></div>
                      <div className="list-body"><div className="list-title">{m.label}</div></div>
                      <ChevronRight size={16} className="list-chevron" />
                    </button>
                  );
                })}
              </div>
              <div className="list">
                {user ? (
                  <>
                    <div className="list-row with-icon">
                      <div className="avatar"><User size={15} /></div>
                      <div className="list-body">
                        <div className="list-title">{user.name}</div>
                        <div className="list-sub">{user.email}</div>
                      </div>
                    </div>
                    <button className="list-row with-icon interactive" onClick={() => { setMoreOpen(false); onLogout(); }}>
                      <div className="list-icon neutral"><LogOut size={16} /></div>
                      <div className="list-body"><div className="list-title" style={{ color: 'var(--red)' }}>로그아웃</div></div>
                    </button>
                  </>
                ) : (
                  <button className="list-row with-icon interactive" onClick={() => { setMoreOpen(false); onLogin(); }}>
                    <div className="list-icon"><LogIn size={16} /></div>
                    <div className="list-body"><div className="list-title">로그인 / 가입</div></div>
                    <ChevronRight size={16} className="list-chevron" />
                  </button>
                )}
              </div>
              <div className="list-footer">거인의 노트 · 김익환 — AI 5단계 독서법 기반</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
