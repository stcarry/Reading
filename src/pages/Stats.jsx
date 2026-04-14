import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, FileText, Clock, Target, TrendingUp,
  Calendar, Award, Zap
} from 'lucide-react';
import { getBooks, getNotes, getReadingLog, getStats } from '../data/store';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [readingLog, setReadingLog] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    setStats(getStats());
    setBooks(getBooks());
    setNotes(getNotes());
    setReadingLog(getReadingLog());

    // Generate full month calendar
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const log = getReadingLog();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const readingDatesMap = {};
    log.filter(l => l.date.startsWith(monthStr)).forEach(l => {
      const day = parseInt(l.date.split('-')[2]);
      readingDatesMap[day] = (readingDatesMap[day] || 0) + l.minutesRead;
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isToday: d === today,
        minutes: readingDatesMap[d] || 0,
        hasRecord: !!readingDatesMap[d],
      });
    }
    setCalendarDays(days);
  }, []);

  // Category stats
  const categoryStats = useMemo(() => {
    const cats = { knowledge: 0, conversation: 0, work: 0, daily: 0, thought: 0 };
    notes.forEach(n => {
      if (cats[n.category] !== undefined) cats[n.category]++;
    });
    return cats;
  }, [notes]);

  // Monthly reading data
  const monthlyReadingData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLog = readingLog.filter(l => l.date.startsWith(monthStr));
      const totalMinutes = monthLog.reduce((acc, l) => acc + (l.minutesRead || 0), 0);
      months.push({
        label: `${d.getMonth() + 1}월`,
        minutes: totalMinutes,
        days: new Set(monthLog.map(l => l.date)).size,
      });
    }
    return months;
  }, [readingLog]);

  const maxMonthMinutes = Math.max(...monthlyReadingData.map(m => m.minutes), 1);

  // Top keywords
  const topKeywords = useMemo(() => {
    const kwMap = {};
    notes.forEach(n => {
      (n.keywords || []).forEach(kw => {
        kwMap[kw] = (kwMap[kw] || 0) + 1;
      });
    });
    return Object.entries(kwMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));
  }, [notes]);

  // Current streak
  const currentStreak = useMemo(() => {
    const dates = new Set(readingLog.map(l => l.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dates.has(dateStr)) streak++;
      else break;
    }
    return streak;
  }, [readingLog]);

  if (!stats) return null;

  const categoryLabels = {
    knowledge: { emoji: '📖', label: '지식', color: 'amber' },
    conversation: { emoji: '💬', label: '대화', color: 'teal' },
    work: { emoji: '💼', label: '일', color: 'violet' },
    daily: { emoji: '🌅', label: '일상', color: 'rose' },
    thought: { emoji: '💡', label: '생각', color: 'green' },
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">성장 통계 📊</h1>
        <p className="page-subtitle">독서를 통한 나의 성장 여정을 돌아봅니다</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid stagger-children mb-6">
        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--amber-glow)', color: 'var(--amber-400)' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--amber-400)' }}>{stats.totalBooks}</div>
          <div className="stat-card-label">전체 서재</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--green-glow)', color: 'var(--green-400)' }}>
            <Target size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--green-400)' }}>{stats.doneBooks}</div>
          <div className="stat-card-label">완독한 책</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--violet-glow)', color: 'var(--violet-400)' }}>
            <FileText size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--violet-400)' }}>{stats.totalNotes}</div>
          <div className="stat-card-label">기록 노트</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--rose-glow)', color: 'var(--rose-400)' }}>
            <Zap size={20} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--rose-400)' }}>{currentStreak}</div>
          <div className="stat-card-label">연속 독서일</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Reading Calendar */}
        <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
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
                title={d.minutes ? `${d.minutes}분 독서` : ''}
                style={{
                  background: d.minutes > 0
                    ? `rgba(245, 158, 11, ${Math.min(d.minutes / 60 * 0.3 + 0.1, 0.5)})`
                    : undefined,
                }}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.15)' }} />
              적음
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.35)' }} />
              보통
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.5)' }} />
              많음
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            📈 월별 독서 시간
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 180, paddingTop: 'var(--space-4)' }}>
            {monthlyReadingData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {m.minutes > 0 ? `${Math.round(m.minutes / 60)}h` : ''}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max((m.minutes / maxMonthMinutes) * 140, 4)}px`,
                    background: i === monthlyReadingData.length - 1
                      ? 'linear-gradient(180deg, var(--amber-400), var(--amber-600))'
                      : 'linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'height var(--transition-slow)',
                  }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Category Distribution */}
        <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            📂 5영역 기록 분포
          </h3>
          <div className="flex flex-col gap-3">
            {Object.entries(categoryLabels).map(([key, info]) => {
              const count = categoryStats[key] || 0;
              const max = Math.max(...Object.values(categoryStats), 1);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 'var(--text-sm)' }}>
                      {info.emoji} {info.label}
                    </span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{count}개</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(count / max) * 100}%`,
                        background: `var(--${info.color}-500)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}>
            💡 김익환 교수의 5가지 기록 영역: 공부(지식), 대화, 생각, 일상, 일 — 균형 잡힌 기록이 성장의 열쇠입니다.
          </div>
        </div>

        {/* Top Keywords */}
        <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            🔑 관심 키워드 TOP
          </h3>
          {topKeywords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
              기록에서 키워드를 추출하면 여기에 표시됩니다
            </div>
          ) : (
            <div className="keyword-cloud" style={{ padding: 0 }}>
              {topKeywords.map((kw, i) => {
                const colors = ['amber', 'teal', 'violet', 'rose', 'green'];
                const color = colors[i % colors.length];
                return (
                  <span
                    key={i}
                    className={`tag tag-${color}`}
                    style={{
                      fontSize: `${Math.min(12 + kw.count * 3, 22)}px`,
                      padding: 'var(--space-2) var(--space-3)',
                    }}
                  >
                    {kw.word} ×{kw.count}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Learning Pyramid */}
      <div className="glass-card-static mt-6" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)', textAlign: 'center' }}>
          🗣 학습 피라미드 — 기억 유지율
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          "설명할 수 없다면, 이해한 것이 아니다" - 아인슈타인
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          {[
            { label: '🎤 가르치기', retention: 90, color: 'var(--green-400)', width: '35%' },
            { label: '🥊 실습/토론', retention: 75, color: 'var(--teal-400)', width: '50%' },
            { label: '💬 대화하기', retention: 50, color: 'var(--amber-400)', width: '65%' },
            { label: '👀 시범 보기', retention: 30, color: 'var(--rose-400)', width: '78%' },
            { label: '👂 듣기', retention: 20, color: 'var(--violet-400)', width: '88%' },
            { label: '📖 읽기', retention: 10, color: 'var(--text-tertiary)', width: '100%' },
          ].map((level, i) => (
            <div key={i} style={{
              width: level.width, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-2) var(--space-4)',
              background: `${level.color}15`, borderRadius: 'var(--radius-sm)',
              border: `1px solid ${level.color}30`, minWidth: 200,
            }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{level.label}</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: level.color }}>{level.retention}%</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          ▲ 능동적 학습 | ▼ 수동적 학습 — 5단계 내재화(설명/토론)로 90% 기억!
        </div>
      </div>

      {/* Growth Summary */}
      <div
        className="glass-card-static mt-6"
        style={{
          padding: 'var(--space-6)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(20,184,166,0.03))',
          border: '1px solid rgba(245,158,11,0.1)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: 'var(--text-xl)' }}>
          🌟 나의 성장 여정
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          "정보 → 지식 → 지혜, 반복과 지속을 통해 지식을 지혜로"
        </p>
        <div className="flex justify-center gap-6" style={{ flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--amber-400)' }}>
              {Math.round(stats.totalMinutes / 60)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>시간 독서</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--teal-400)' }}>
              {stats.totalKeywords}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>키워드 추출</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--violet-400)' }}>
              {stats.totalNotes}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>기록 누적</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--green-400)' }}>
              {stats.doneBooks}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>완독</div>
          </div>
        </div>
      </div>
    </div>
  );
}
