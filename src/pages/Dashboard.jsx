import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Library, Sparkles, PenTool, TrendingUp, Timer,
  ChevronRight, CalendarCheck, Trophy, BookMarked, Plus, Hash
} from 'lucide-react';
import { getBooks, getNotes, getReadingLog, getStats, updateBook } from '../data/store';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [fetchedStats, fetchedBooks, fetchedNotes, fetchedLogs] = await Promise.all([
        getStats(),
        getBooks(),
        getNotes(),
        getReadingLog()
      ]);

      setStats(fetchedStats);
      setBooks(fetchedBooks);
      setRecentNotes(fetchedNotes.slice(-3).reverse());

      // Generate calendar days for current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();

      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const readingDates = new Set(
        fetchedLogs.filter(l => l.date.startsWith(monthStr)).map(l => parseInt(l.date.split('-')[2]))
      );

      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push({ day: null });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        days.push({
          day: d,
          isToday: d === today,
          hasRecord: readingDates.has(d),
        });
      }
      setCalendarDays(days);
    };

    loadDashboardData();
  }, []);

  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books]);

  if (!stats) return null;

  const categoryLabels = {
    knowledge: '📖 지식',
    conversation: '💬 대화',
    work: '💼 일',
    daily: '🌅 일상',
    thought: '💡 생각',
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Hero Header — Minimal & Modern */}
      <div style={{
        marginBottom: 'var(--space-8)',
        padding: 'var(--space-8) var(--space-8)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(20,184,166,0.04) 50%, transparent 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-glass)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, var(--amber-500), var(--teal-400), var(--violet-400))',
          opacity: 0.6,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{
              fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--amber-400)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)',
            }}>
              Reading Giant
            </p>
            <h1 style={{
              fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.03em',
              marginBottom: 'var(--space-1)', color: 'var(--text-primary)',
            }}>
              안녕하세요, 오늘도 성장하는 하루 되세요.
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
        </div>

        {/* Inline Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--amber-glow)', color: 'var(--amber-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Library size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
                {stats.readingBooks}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>읽는 중</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--green-glow)', color: 'var(--green-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trophy size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
                {stats.doneBooks}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>완독</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--violet-glow)', color: 'var(--violet-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PenTool size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
                {stats.totalNotes}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>기록</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--rose-glow)', color: 'var(--rose-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
                {stats.readingDaysThisMonth}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>이번 달</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Currently Reading */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Library size={24} className="text-amber-400" /> 읽고 있는 책
              </h2>
              <Link to="/library" className="btn btn-ghost btn-sm">
                전체 보기 <ChevronRight size={14} />
              </Link>
            </div>

            {readingBooks.length === 0 ? (
              <div className="glass-card-static empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-state-icon">📚</div>
                <div className="empty-state-title">아직 읽고 있는 책이 없어요</div>
                <div className="empty-state-desc">서재에서 새로운 책을 추가해보세요!</div>
                <Link to="/library" className="btn btn-primary">
                  <Plus size={16} /> 책 추가하기
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 stagger-children">
                {readingBooks.map(book => {
                  const progress = book.totalPages > 0
                    ? Math.round((book.currentPage / book.totalPages) * 100)
                    : 0;
                  return (
                    <div key={book.id} className="flex flex-col gap-0">
                    <Link
                      to={`/coaching?bookId=${book.id}`}
                      className="glass-card"
                      style={{
                        padding: 'var(--space-5)',
                        display: 'flex',
                        gap: 'var(--space-4)',
                        textDecoration: 'none',
                        color: 'inherit',
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 90,
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          background: 'var(--bg-tertiary)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <BookMarked size={24} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{book.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                          {book.author}
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            {book.currentPage} / {book.totalPages}p
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--amber-400)', fontWeight: 600 }}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-5)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-glass)',
                      borderTop: 'none',
                      borderBottomLeftRadius: 'var(--radius-lg)',
                      borderBottomRightRadius: 'var(--radius-lg)',
                    }}>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max={book.totalPages || 99999}
                        value={book.currentPage}
                        onChange={async (e) => {
                          const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), book.totalPages || 99999);
                          await updateBook(book.id, { current_page: val });
                          const data = await getBooks();
                          setBooks(data);
                        }}
                        style={{ width: '65px', fontSize: 'var(--text-xs)', padding: '4px 6px', textAlign: 'center' }}
                        title="현재 페이지"
                      />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>/ {book.totalPages}p</span>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '10px', padding: '4px 10px', marginLeft: 'auto' }}
                        onClick={async () => {
                          const newPage = Math.min((book.currentPage || 0) + 10, book.totalPages || 99999);
                          await updateBook(book.id, { current_page: newPage });
                          const data = await getBooks();
                          setBooks(data);
                        }}
                        title="10페이지 추가"
                      >
                        +10p
                      </button>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenTool size={24} className="text-violet-400" /> 최근 기록
              </h2>
              <Link to="/notes" className="btn btn-ghost btn-sm">
                전체 보기 <ChevronRight size={14} />
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div className="glass-card-static" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)' }}>아직 기록이 없습니다</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 stagger-children">
                {recentNotes.map(note => {
                  const book = books.find(b => b.id === note.bookId);
                  return (
                    <div key={note.id} className="glass-card note-card">
                      <div className="note-card-header">
                        <span className="tag tag-amber">{book?.title || '알 수 없는 책'}</span>
                        <span className="note-card-date">
                          {new Date(note.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {note.keywords?.length > 0 && (
                        <div className="note-card-keywords">
                          {note.keywords.map((kw, i) => (
                            <span key={i} className="tag tag-teal">🔑 {kw}</span>
                          ))}
                        </div>
                      )}
                      <div className="note-card-preview">{note.content}</div>
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <span className="tag tag-violet">{categoryLabels[note.category] || note.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* AI Coaching Quick Start */}
          <div
            className="glass-card-static"
            style={{
              padding: 'var(--space-6)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,184,166,0.05))',
              border: '1px solid rgba(99,102,241,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
              <Sparkles size={100} />
            </div>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)', color: 'var(--indigo-400)' }}>
               <Sparkles size={32} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>AI 독서 코칭</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              5단계 독서법으로 책을 깊이 이해하고 완전히 내 것으로 만들어보세요.
            </p>
            <Link to="/coaching" className="btn btn-primary w-full" style={{ justifyContent: 'center', gap: '8px' }}>
              시작하기 <ChevronRight size={16} />
            </Link>
          </div>

          {/* Calendar */}
          <div className="glass-card-static" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
              📅 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 독서 캘린더
            </h3>
            <div className="calendar-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className={`calendar-day ${d.hasRecord ? 'has-record' : ''} ${d.isToday ? 'today' : ''}`}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card-static" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>📊 독서 요약</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={14} className="text-teal-400" />
                  추출 키워드
                </span>
                <span style={{ fontWeight: 700 }}>{stats.totalKeywords}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookMarked size={14} className="text-violet-400" />
                  전체 서재
                </span>
                <span style={{ fontWeight: 700 }}>{stats.totalBooks}권</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
