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
    const loadData = async () => {
      const [s, b, n, log] = await Promise.all([
        getStats(),
        getBooks(),
        getNotes(),
        getReadingLog()
      ]);

      setStats(s);
      setBooks(b);
      setNotes(n);
      setReadingLog(log);

      // Generate full month calendar
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();

      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const readingDatesMap = {};
      log.filter(l => l.date && l.date.startsWith(monthStr)).forEach(l => {
        const day = parseInt(l.date.split('-')[2]);
        readingDatesMap[day] = (readingDatesMap[day] || 0) + (l.minutesRead || 0);
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
    };
    loadData();
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
                style={{
                  background: d.hasRecord
                    ? `rgba(245, 158, 11, 0.2)`
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
            📚 지식 누적 현황
          </h3>
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
             <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--amber-400)', marginBottom: 'var(--space-2)' }}>
               {stats.totalBooks}
             </div>
             <p style={{ color: 'var(--text-secondary)' }}>전체 서재에 등록된 도서 수</p>
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
            <div className="keyword-cloud" style={{ 
              padding: 'var(--space-4)', 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 'var(--space-3) var(--space-6)',
              minHeight: '280px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)'
            }}>
              {topKeywords.map((kw, i) => {
                const colors = ['var(--amber-400)', 'var(--teal-400)', 'var(--violet-400)', 'var(--rose-400)', 'var(--green-400)', 'var(--text-primary)'];
                const color = colors[i % colors.length];
                // 빈도수에 따른 폰트 사이즈 (14px ~ 42px)
                const fontSize = Math.min(14 + kw.count * 8, 42);
                // 약 15% 확률로 세로 회전
                const rotate = i % 7 === 0 ? 'rotate(-90deg)' : 'none';
                const opacity = Math.max(0.4, Math.min(1, 0.3 + (kw.count * 0.2)));
                
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: `${fontSize}px`,
                      fontWeight: kw.count > 1 ? 800 : 500,
                      color: color,
                      opacity: opacity,
                      transform: rotate,
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                      textShadow: kw.count > 2 ? `0 0 20px ${color}33` : 'none',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      margin: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = 1;
                      e.target.style.transform = `${rotate} scale(1.1)`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = opacity;
                      e.target.style.transform = rotate;
                    }}
                  >
                    {kw.word}
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
              {stats.totalBooks}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>전체 서재</div>
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
