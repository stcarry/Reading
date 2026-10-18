import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { login, signUp } from '../data/store';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    if (isSignUp && !name) { setError('이름을 입력해주세요.'); return; }
    setLoading(true);
    try {
      let user;
      if (isSignUp) {
        user = await signUp(email, password, name);
        alert('회원가입이 완료되었습니다. 이메일을 확인해 주세요 (설정에 따라 확인이 필요할 수 있습니다).');
      } else {
        user = await login(email, password);
      }
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || '인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="login-title">{isSignUp ? '회원가입' : '로그인'}</h2>
          <button className="btn btn-ghost muted btn-icon" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="t-footnote c-2 mb-4">서재, 코칭 대화, 기록 노트가 계정에 안전하게 저장됩니다.</p>

          {isSignUp && (
            <div className="field">
              <label htmlFor="login-name">이름</label>
              <div className="input-wrap">
                <User size={16} />
                <input id="login-name" className="input" type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="login-email">이메일</label>
            <div className="input-wrap">
              <Mail size={16} />
              <input id="login-email" className="input" type="email" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">비밀번호</label>
            <div className="input-wrap">
              <Lock size={16} />
              <input id="login-password" className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isSignUp ? 'new-password' : 'current-password'} required />
            </div>
          </div>

          {error && <div className="hint" style={{ color: 'var(--red)' }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? '처리 중…' : (isSignUp ? '가입하기' : '로그인')}
          </button>

          <div className="text-center mt-4">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
              {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
