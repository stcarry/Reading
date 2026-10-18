import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/** 세그먼트 컨트롤 — items: [{ key, label, count? }] */
export function Segmented({ items, value, onChange, block = false, ariaLabel }) {
  return (
    <div className={`seg ${block ? 'seg-block' : ''}`} role="tablist" aria-label={ariaLabel}>
      {items.map(it => (
        <button
          key={it.key}
          role="tab"
          aria-selected={value === it.key}
          className={`seg-item ${value === it.key ? 'active' : ''}`}
          onClick={() => onChange(it.key)}
        >
          {it.icon}
          {it.label}
          {it.count !== undefined && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** 빈 상태 */
export function EmptyState({ icon, title, desc, action, compact = false }) {
  return (
    <div className={`card empty ${compact ? 'pad-sm' : ''}`}>
      {icon && <div className="empty-icon">{icon}</div>}
      {title && <div className="empty-title">{title}</div>}
      {desc && <div className="empty-desc">{desc}</div>}
      {action}
    </div>
  );
}

/** 모달 / 시트 */
export function Modal({ open, onClose, title, children, footer, size = '', labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={e => e.stopPropagation()}>
        {title !== undefined && (
          <div className="modal-header">
            <h2 className="modal-title" id={labelledBy}>{title}</h2>
            <button className="btn btn-ghost muted btn-icon" onClick={onClose} aria-label="닫기"><X size={18} /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/** 확인 다이얼로그 (iOS Alert 스타일) */
export function ConfirmDialog({ open, onClose, onConfirm, icon, title, desc, confirmLabel = '확인', danger = false, loading = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="alert-body">
          {icon && <div className={`alert-icon ${danger ? 'danger' : ''}`}>{icon}</div>}
          <div className="alert-title">{title}</div>
          {desc && <div className="alert-desc">{desc}</div>}
        </div>
        <div className="alert-actions">
          <button className="btn btn-secondary btn-lg" onClick={onClose}>취소</button>
          <button className={`btn btn-lg ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/** 팝오버 메뉴 — trigger를 감싸고 children에 .menu-item 버튼을 둡니다 */
export function Menu({ trigger, children, align = 'right', onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    onOpenChange?.(open);
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open, onOpenChange]);

  return (
    <div className="menu-anchor" ref={ref}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>{trigger}</div>
      {open && (
        <div className={`menu ${align}`} role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, label, onClick, danger = false, checked }) {
  return (
    <button className={`menu-item ${danger ? 'danger' : ''}`} role="menuitem" onClick={onClick}>
      <span className="flex items-center gap-2">{icon}{label}</span>
      {checked && <span aria-hidden>✓</span>}
    </button>
  );
}

/** 페이지 스켈레톤 */
export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="page-container" aria-busy="true" aria-live="polite">
      <div className="skeleton title mb-3" />
      <div className="skeleton line mb-6" style={{ width: '60%' }} />
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton block" />)}
      </div>
    </div>
  );
}
