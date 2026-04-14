import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Brain, FileText, TrendingUp, Clock,
  ChevronRight, Flame, Target, BookMarked, Plus
} from 'lucide-react';
import { getBooks, getNotes, getReadingLog, getStats } from '../data/store';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    setStats(getStats());
    setBooks(getBooks());
    setRecentNotes(getNotes().slice(-3).reverse());

    // Generate calendar days for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const log = getReadingLog();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const readingDates = new Set(
      log.filter(l => l.date.startsWith(monthStr)).map(l => parseInt(l.date.split('-')[2]))
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
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          안녕하세요! 📚
        </h1>
        <p className="page-subtitle">
          오늘도 한 걸음 성장하는 독서를 시작해볼까요?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--amber-glow)', color: 'var(--amber-400)' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--amber-400)' }}>
            {stats.readingBooks}
          </div>
          <div className="stat-card-label">읽고 있는 책</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--green-glow)', color: 'var(--green-400)' }}>
            <Target size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--green-400)' }}>
            {stats.doneBooks}
          </div>
          <div className="stat-card-label">완독한 책</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--violet-glow)', color: 'var(--violet-400)' }}>
            <FileText size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--violet-400)' }}>
            {stats.totalNotes}
          </div>
          <div className="stat-card-label">기록 노트</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--rose-glow)', color: 'var(--rose-400)' }}>
            <Flame size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--rose-400)' }}>
            {stats.readingDaysThisMonth}
          </div>
          <div className="stat-card-label">이번 달 독서일</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Currently Reading */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>📖 읽고 있는 책</h2>
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
                    <Link
                      to={`/coaching?bookId=${book.id}`}
                      key={book.id}
                      className="glass-card"
                      style={{
                        padding: 'var(--space-5)',
                        display: 'flex',
                        gap: 'var(--space-4)',
                        textDecoration: 'none',
                        color: 'inherit',
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>📝 최근 기록</h2>
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
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(20,184,166,0.05))',
              border: '1px solid rgba(245,158,11,0.15)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🧠</div>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>AI 독서 코칭</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              5단계 독서법으로 책을 깊이 이해하고 완전히 내 것으로 만들어보세요.
            </p>
            <Link to="/coaching" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
              <Brain size={16} /> 코칭 시작하기
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
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                  총 독서 시간
                </span>
                <span style={{ fontWeight: 700 }}>{Math.round(stats.totalMinutes / 60)}시간 {stats.totalMinutes % 60}분</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                  추출 키워드
                </span>
                <span style={{ fontWeight: 700 }}>{stats.totalKeywords}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
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
