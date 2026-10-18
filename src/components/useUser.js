import { useEffect, useState } from 'react';
import { getCurrentUser, logout, onAuthStateChange } from '../data/store';

const toUser = (u) => (u ? { ...u, name: u.user_metadata?.full_name || u.email?.split('@')[0] || '사용자' } : null);

/** 현재 로그인 사용자 상태를 구독하는 훅 (Sidebar / TabBar 공용) */
export default function useUser() {
  const [user, setUser] = useState(undefined); // undefined = 확인 중

  useEffect(() => {
    let ignore = false;
    getCurrentUser().then(u => { if (!ignore) setUser(toUser(u)); });
    const { data: { subscription } } = onAuthStateChange((_event, sessionUser) => {
      if (!ignore) setUser(toUser(sessionUser));
    });
    return () => { ignore = true; subscription?.unsubscribe(); };
  }, []);

  const signOut = async () => {
    try { await logout(); setUser(null); } catch (err) { console.error('Logout failed:', err); }
  };

  return { user, setUser: (u) => setUser(toUser(u)), signOut };
}
