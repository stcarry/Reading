import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BookMarked, Check, ChevronRight, Flame, LogIn, NotebookPen, Plus,
} from 'lucide-react';
import { getBooks, getNotes, getCoachingSessions, getCurrentUser, updateBook } from '../data/store';
import { getNoteType, groupNotesByChapter } from '../utils/notes';

const COACH_STEPS = [
  { num: 1, title: '예열', desc: '구조 파악' },
  { num: 2, title: '몰입', desc: '난관 돌파' },
  { num: 3, title: '중간점검', desc: '챕터 요약' },
  { num: 4, title: '정리', desc: '3단 구조' },
  { num: 5, title: '내재화', desc: '설명·토론' },
];

const WEEKS = 12;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// 코칭 세션에서 사용자가 실제로 대화한 단계를 추출
function coachingProgress(sessions, bookId) {
  const done = new Set();
  sessions.filter(s => s.bookId === bookId).forEach(s => {
    const userMsgs = (s.messages || []).filter(m => m.role === 'user').length;
    if (userMsgs === 0) return;
    const step = String(s.step).startsWith('5') ? 5 : Number(s.step);
    if (step) done.add(step);
  });
  return done;
}

export default function Dashboard() {
  const [user, setUser] = useState(undefined);
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchAll = async () => {
      const u = await getCurrentUser();
      if (ignore) return;
      setUser(u);
      if (!u) {
        setLoaded(true);
        return;
      }
      const [b, n, s] = await Promise.all([getBooks(), getNotes(), getCoachingSessions()]);
      if (ignore) return;
      setBooks(b);
      setNotes(n);
      setSessions(s);
      setLoaded(true);
    };

    fetchAll();

    const onChange = () => {
      fetchAll();
    };
    window.addEventListener('rg-data-change', onChange);
    return () => {
      ignore = true;
      window.removeEventListener('rg-data-change', onChange);
    };
  }, []);

  // 지금 읽는 책: '읽는 중' 상태 + (없다면) 최근 기록/코칭이 있는 책
  const activeBooks = useMemo(() => {
    const lastActivity = (id) => Math.max(
      0,
      ...notes.filter(n => n.bookId === id).map(n => new Date(n.createdAt).getTime()),
      ...sessions.filter(s => s.bookId === id).map(s => new Date(s.updated_at || s.created_at).getTime()),
    );
    let list = books.filter(b => b.status === 'reading');
    if (list.length === 0) list = books.filter(b => b.status !== 'done' && lastActivity(b.id) > 0);
    return list
      .map(b => ({ book: b, last: lastActivity(b.id) }))
      .sort((a, b) => b.last - a.last)
      .slice(0, 4)
      .map(({ book }) => {
        const bookNotes = notes.filter(n => n.bookId === book.id);
        const chapters = groupNotesByChapter(bookNotes);
        const lastNote = bookNotes.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const done = coachingProgress(sessions, book.id);
        const next = COACH_STEPS.find(s => !done.has(s.num)) || COACH_STEPS[4];
        return { book, chapters, lastNote, done, next, noteCount: bookNotes.length };
      });
  }, [books, notes, sessions]);

  // 활동 히트맵 (기록 작성 + 코칭 대화)
  const activity = useMemo(() => {
    const counts = {};
    notes.forEach(n => { const k = dayKey(n.createdAt); counts[k] = (counts[k] || 0) + 1; });
    sessions.forEach(s => {
      if (!(s.messages || []).some(m => m.role === 'user')) return;
      const k = dayKey(s.updated_at || s.created_at);
      counts[k] = (counts[k] || 0) + 1;
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7); // 12주 전 일요일부터

    const cells = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      cells.push({ key: k, count: counts[k] || 0, date: new Date(d) });
    }
    const activeDays = cells.filter(c => c.count > 0).length;

    let streak = 0;
    const cursor = new Date(today);
    if (!counts[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1); // 오늘 아직 안 했으면 어제부터
    while (counts[dayKey(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }

    return { cells, activeDays, streak, todayCount: counts[dayKey(today)] || 0 };
  }, [notes, sessions]);

  const recentNotes = useMemo(
    () => notes.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [notes],
  );

  const topKeywords = useMemo(() => {
    const c = {};
    notes.forEach(n => (n.keywords || []).forEach(k => { c[k] = (c[k] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [notes]);

  const setPage = async (book, page) => {
    const val = Math.min(Math.max(0, page), book.totalPages || 99999);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, currentPage: val } : b));
    await updateBook(book.id, { current_page: val });
  };

  if (!loaded) return <div className="page-container" />;

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const primary = activeBooks[0];
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  if (!user) {
    return (
      <div className="page-container animate-fade-in">
        <section className="db-hero">
          <div className="db-kicker">{today}</div>
          <h1 className="db-title">로그인하고 독서를 이어가세요</h1>
          <p className="db-sub">서재, 코칭 대화, 기록 노트는 계정에 안전하게 저장되어 있습니다.</p>
          <div className="db-hero-cta" style={{ color: 'var(--text-secondary)' }}>
            <LogIn size={16} /> 왼쪽 메뉴 하단의 <strong>로그인</strong> 버튼을 눌러주세요
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Hero: 오늘 이어서 할 일 */}
      <section className="db-hero">
        <div className="db-kicker">{today}</div>
        <h1 className="db-title">{name}님, {primary ? '어제에 이어서 읽어볼까요?' : '어떤 책부터 시작할까요?'}</h1>
        {primary ? (
          <div className="db-hero-row">
            <p className="db-sub">
              <strong>{primary.book.title}</strong> — 코칭 {primary.done.size}/5단계 완료
              {primary.lastNote?.chapter && <> · 마지막 기록 「{primary.lastNote.chapter}」</>}
            </p>
            <Link to={`/coaching?bookId=${primary.book.id}&step=${primary.next.num}`} className="btn btn-primary db-hero-cta-btn" id="dashboard-continue-btn">
              {primary.next.num}단계 {primary.next.title} 이어하기 <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="db-hero-row">
            <p className="db-sub">서재에 책을 추가하고 ‘읽는 중’으로 바꾸면 이곳에 진행 상황이 표시됩니다.</p>
            <Link to="/library" className="btn btn-primary db-hero-cta-btn"><Plus size={16} /> 서재로 가기</Link>
          </div>
        )}
        <div className="db-hero-stats">
          <div><span className="db-stat-num">{activity.streak}</span><span className="db-stat-label"><Flame size={12} /> 연속 기록일</span></div>
          <div><span className="db-stat-num">{activity.activeDays}</span><span className="db-stat-label">최근 {WEEKS}주 활동일</span></div>
          <div><span className="db-stat-num">{notes.length}</span><span className="db-stat-label">누적 기록</span></div>
          <div><span className="db-stat-num">{books.filter(b => b.status === 'done').length}</span><span className="db-stat-label">완독</span></div>
        </div>
      </section>

      <div className="db-grid">
        {/* 왼쪽: 지금 읽는 책 */}
        <div className="db-col">
          <div className="db-section-head">
            <h2>지금 읽는 책</h2>
            <Link to="/library" className="btn btn-ghost btn-sm">서재 <ChevronRight size={14} /></Link>
          </div>

          {activeBooks.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">읽고 있는 책이 없어요</div>
              <div className="empty-state-desc">서재에서 책 상태를 ‘읽는 중’으로 바꿔보세요.</div>
              <Link to="/library" className="btn btn-primary"><Plus size={16} /> 서재로 가기</Link>
            </div>
          ) : activeBooks.map(({ book, chapters, lastNote, done, next, noteCount }) => {
            const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : null;
            return (
              <article key={book.id} className="db-book glass-card-static">
                <div className="db-book-top">
                  <div className="db-book-cover">
                    {book.cover ? <img src={book.cover} alt={book.title} /> : <BookMarked size={22} />}
                  </div>
                  <div className="db-book-info">
                    <h3>{book.title}</h3>
                    <div className="db-book-author">{book.author}</div>
                    {progress !== null && (
                      <div className="db-book-progress">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                        <div className="db-page-row">
                          <input
                            type="number" className="input" min="0" max={book.totalPages}
                            value={book.currentPage}
                            onChange={(e) => setPage(book, parseInt(e.target.value) || 0)}
                            aria-label="현재 페이지"
                          />
                          <span>/ {book.totalPages}p · {progress}%</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setPage(book, (book.currentPage || 0) + 10)}>+10p</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 코칭 5단계 진행 */}
                <div className="db-steps" aria-label="코칭 진행 단계">
                  {COACH_STEPS.map(s => {
                    const state = done.has(s.num) ? 'done' : s.num === next.num ? 'next' : '';
                    return (
                      <Link key={s.num} to={`/coaching?bookId=${book.id}&step=${s.num}`} className={`db-step ${state}`} title={`${s.num}단계 ${s.title} · ${s.desc}`}>
                        <span className="db-step-dot">{state === 'done' ? <Check size={12} /> : s.num}</span>
                        <span className="db-step-label">{s.title}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="db-book-foot">
                  <Link to={`/notes?bookId=${book.id}`} className="db-book-notes">
                    <NotebookPen size={14} />
                    {noteCount > 0
                      ? <>챕터 {chapters.length}개 · 기록 {noteCount}개{lastNote?.chapter && <span> · 최근 「{lastNote.chapter}」</span>}</>
                      : '아직 기록이 없어요'}
                  </Link>
                  <Link to={`/coaching?bookId=${book.id}&step=${next.num}`} className="btn btn-primary btn-sm">
                    {done.size === 5 ? '내재화 계속하기' : `${next.num}단계 ${next.title}`} <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* 오른쪽: 활동 · 최근 기록 · 키워드 */}
        <div className="db-col">
          <div className="glass-card-static db-panel">
            <div className="db-panel-head">
              <h3>독서 활동</h3>
              <span>{activity.todayCount > 0 ? '오늘 기록 완료 ✓' : '오늘 아직 기록 없음'}</span>
            </div>
            <div className="db-heatmap">
              {activity.cells.map(c => (
                <div
                  key={c.key}
                  className={`db-heat l${Math.min(c.count, 4)}`}
                  title={`${c.date.toLocaleDateString('ko-KR')} · 활동 ${c.count}회`}
                />
              ))}
            </div>
            <div className="db-heat-legend">
              <span>{WEEKS}주 전</span>
              <span className="db-heat-scale">적음 <i className="db-heat l0" /><i className="db-heat l1" /><i className="db-heat l2" /><i className="db-heat l4" /> 많음</span>
              <span>오늘</span>
            </div>
          </div>

          <div className="glass-card-static db-panel">
            <div className="db-panel-head">
              <h3>최근 기록</h3>
              <Link to="/notes" className="btn btn-ghost btn-sm">전체 <ChevronRight size={14} /></Link>
            </div>
            {recentNotes.length === 0 ? (
              <p className="db-muted">코칭 3단계에서 챕터 요약을 남기면 여기에 표시됩니다.</p>
            ) : (
              <ul className="db-recent">
                {recentNotes.map(n => {
                  const book = books.find(b => b.id === n.bookId);
                  const t = getNoteType(n.type);
                  const snippet = (n.content || '').replace(/【.*?】/g, ' ').replace(/[#*>`_-]/g, '').trim();
                  return (
                    <li key={n.id}>
                      <Link to={n.bookId ? `/notes?bookId=${n.bookId}` : '/notes'}>
                        <div className="db-recent-top">
                          <span className="db-recent-chapter">{t?.emoji} {n.chapter || t?.label || '기록'}</span>
                          <span className="db-recent-date">{new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                        </div>
                        <div className="db-recent-snippet">{snippet}</div>
                        <div className="db-recent-book">{book?.title || '책 미지정'}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {topKeywords.length > 0 && (
            <div className="glass-card-static db-panel">
              <div className="db-panel-head"><h3>자주 등장한 키워드</h3></div>
              <div className="db-keywords">
                {topKeywords.map(([k, c]) => <span key={k}>#{k}{c > 1 && <em>{c}</em>}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
