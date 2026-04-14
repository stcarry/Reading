import { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
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
    setLoading(true);

    try {
      if (!email || !password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return;
      }

      let user;
      if (isSignUp) {
        if (!name) {
          setError('이름을 입력해주세요.');
          setLoading(false);
          return;
        }
        user = await signUp(email, password, name);
        alert('회원가입이 완료되었습니다! 이메일을 확인해 주세요 (설정에 따라 확인이 필요할 수 있습니다).');
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
      <div 
        className="modal glass-card-static" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', width: '90%', animation: 'slideUp 0.3s var(--transition-base)' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {isSignUp ? '회원가입' : '로그인'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body flex flex-col gap-4">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            리딩 자이언트와 함께 성장하는 독서 여정을 시작하세요.
          </p>

          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)' }}>이름</label>
              <div style={{ position: 'relative' }}>
                <UserPlus size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  className="input"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)' }}>이메일</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="input"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)' }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--rose-400)', fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            {!loading && (isSignUp ? <UserPlus size={18} style={{ marginLeft: '8px' }} /> : <LogIn size={18} style={{ marginLeft: '8px' }} />)}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
