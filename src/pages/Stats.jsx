import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, FileText, Target, Flame, Hash, Mic, Users, MessageCircle, Eye, Ear, BookMarked, Info,
} from 'lucide-react';
import { getBooks, getNotes, getReadingLog, getStats } from '../data/store';
import { CATEGORIES } from '../utils/notes';
import { PageSkeleton } from '../components/ui';

const PYRAMID = [
  { label: '가르치기', icon: Mic, retention: 90, width: '36%', active: true },
  { label: '실습·토론', icon: Users, retention: 75, width: '50%', active: true },
  { label: '대화하기', icon: MessageCircle, retention: 50, width: '64%', active: true },
  { label: '시범 보기', icon: Eye, retention: 30, width: '76%' },
  { label: '듣기', icon: Ear, retention: 20, width: '88%' },
  { label: '읽기', icon: BookOpen, retention: 10, width: '100%' },
];

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [readingLog, setReadingLog] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [s, b, n, log] = await Promise.all([getStats(), getBooks(), getNotes(), getReadingLog()]);
      setStats(s); setBooks(b); setNotes(n); setReadingLog(log);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      // 독서 로그 + 기록 작성일을 활동으로 집계
      const activity = {};
      log.filter(l => l.date && l.date.startsWith(monthStr)).forEach(l => {
        const day = parseInt(l.date.split('-')[2]);
        activity[day] = (activity[day] || 0) + 1;
      });
      n.forEach(note => {
        const d = new Date(note.createdAt);
        if (d.getFullYear() === year && d.getMonth() === month) activity[d.getDate()] = (activity[d.getDate()] || 0) + 1;
      });

      const days = [];
      for (let i = 0; i < firstDay; i++) days.push({ day: null });
      for (let d = 1; d <= daysInMonth; d++) days.push({ day: d, isToday: d === today, count: activity[d] || 0 });
      setCalendarDays(days);
    };
    loadData();
  }, []);

  const categoryStats = useMemo(() => {
    const cats = {};
    CATEGORIES.forEach(c => { cats[c.key] = 0; });
    notes.forEach(n => { if (cats[n.category] !== undefined) cats[n.category]++; });
    return cats;
  }, [notes]);

  const topKeywords = useMemo(() => {
    const kwMap = {};
    notes.forEach(n => (n.keywords || []).forEach(kw => { kwMap[kw] = (kwMap[kw] || 0) + 1; }));
    return Object.entries(kwMap).sort(([, a], [, b]) => b - a).slice(0, 10).map(([word, count]) => ({ word, count }));
  }, [notes]);

  const currentStreak = useMemo(() => {
    const dates = new Set([
      ...readingLog.map(l => l.date),
      ...notes.map(n => {
        const d = new Date(n.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }),
    ]);
    let streak = 0;
    const cursor = new Date();
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dates.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (dates.has(key(cursor)) && streak < 365) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }, [readingLog, notes]);

  if (!stats) return <PageSkeleton rows={3} />;

  const maxCat = Math.max(...Object.values(categoryStats), 1);
  const maxKw = Math.max(...topKeywords.map(k => k.count), 1);
  const activeDays = calendarDays.filter(d => d.count > 0).length;
  const now = new Date();

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">성장 통계</h1>
          <p className="page-subtitle">독서를 통한 나의 성장 여정을 돌아봅니다</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label"><BookOpen size={13} /> 전체 서재</div>
          <div className="stat-value">{stats.totalBooks}<small>권</small></div>
        </div>
        <div className="stat">
          <div className="stat-label"><Target size={13} /> 완독</div>
          <div className="stat-value">{stats.doneBooks}<small>권</small></div>
        </div>
        <div className="stat">
          <div className="stat-label"><FileText size={13} /> 기록 노트</div>
          <div className="stat-value">{stats.totalNotes}<small>개</small></div>
        </div>
        <div className="stat">
          <div className="stat-label"><Flame size={13} /> 연속 활동일</div>
          <div className="stat-value">{currentStreak}<small>일</small></div>
        </div>
      </div>

      <div className="st-grid">
        {/* 캘린더 */}
        <div className="card">
          <div className="card-head">
            <h3>{now.getFullYear()}년 {now.getMonth() + 1}월</h3>
            <span className="meta">활동 {activeDays}일</span>
          </div>
          <div className="calendar">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="calendar-dow">{d}</div>)}
            {calendarDays.map((d, i) => (
              <div
                key={i}
                className={`calendar-day ${d.count > 0 ? 'has' : ''} ${d.count >= 3 ? 'l3' : d.count === 2 ? 'l2' : ''} ${d.isToday ? 'today' : ''}`}
                title={d.day ? `${d.day}일 · 활동 ${d.count}회` : undefined}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="calendar-legend">
            <span><i style={{ background: 'var(--accent-tint)' }} />1회</span>
            <span><i style={{ background: 'var(--accent-tint-strong)' }} />2회</span>
            <span><i style={{ background: 'var(--accent)' }} />3회 이상</span>
          </div>
        </div>

        {/* 5영역 분포 */}
        <div className="card">
          <div className="card-head">
            <h3>5영역 기록 분포</h3>
            <span className="meta">총 {notes.length}개</span>
          </div>
          <div className="bar-list">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const count = categoryStats[c.key] || 0;
              return (
                <div key={c.key} className="bar-row">
                  <span className="bar-label"><Icon size={14} /> {c.label}</span>
                  <div className="bar-track"><i style={{ width: `${(count / maxCat) * 100}%` }} /></div>
                  <span className="bar-value">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="hint mt-4" style={{ marginBottom: 0 }}>
            <Info size={14} />
            <span>김익환 교수의 5가지 기록 영역 — 공부(지식), 대화, 생각, 일상, 일. 균형 잡힌 기록이 성장의 열쇠입니다.</span>
          </div>
        </div>

        {/* 키워드 */}
        <div className="card">
          <div className="card-head">
            <h3>관심 키워드</h3>
            <span className="meta">상위 {topKeywords.length}개</span>
          </div>
          {topKeywords.length === 0 ? (
            <div className="empty" style={{ padding: 'var(--s-8) 0' }}>
              <div className="empty-icon"><Hash size={20} /></div>
              <div className="empty-desc">기록에 키워드를 남기면 여기에 표시됩니다.</div>
            </div>
          ) : (
            <div className="kw-list">
              {topKeywords.map((kw, i) => (
                <div key={kw.word} className="kw-row">
                  <span className="kw-rank">{i + 1}</span>
                  <span className="kw-word">{kw.word}</span>
                  <span className="kw-count">{kw.count}회</span>
                  <div className="bar-track"><i style={{ width: `${(kw.count / maxKw) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 학습 피라미드 */}
        <div className="card">
          <div className="card-head">
            <h3>학습 피라미드 — 기억 유지율</h3>
          </div>
          <p className="t-footnote c-2 text-center mb-4">“설명할 수 없다면, 이해한 것이 아니다” — 아인슈타인</p>
          <div className="pyramid">
            {PYRAMID.map(level => {
              const Icon = level.icon;
              return (
                <div key={level.label} className={`pyramid-row ${level.active ? '' : 'passive'}`} style={{ width: level.width }}>
                  <span><Icon size={14} /> {level.label}</span>
                  <b>{level.retention}%</b>
                </div>
              );
            })}
          </div>
          <div className="pyramid-foot">
            <span>위 — 능동적 학습 (가르치기·토론)</span>
            <span>아래 — 수동적 학습 (읽기·듣기)</span>
          </div>
        </div>
      </div>

      {/* 성장 요약 */}
      <div className="card mt-4">
        <div className="text-center mb-4">
          <h3 className="t-title3">나의 성장 여정</h3>
          <p className="t-footnote c-2 mt-2">정보 → 지식 → 지혜. 반복과 지속을 통해 지식을 지혜로.</p>
        </div>
        <div className="summary-row">
          <div><div className="summary-val">{stats.totalBooks}</div><div className="summary-lbl">전체 서재</div></div>
          <div><div className="summary-val">{stats.totalKeywords}</div><div className="summary-lbl">키워드 추출</div></div>
          <div><div className="summary-val">{stats.totalNotes}</div><div className="summary-lbl">기록 누적</div></div>
          <div><div className="summary-val">{stats.doneBooks}</div><div className="summary-lbl">완독</div></div>
        </div>
      </div>

      {books.length === 0 && (
        <p className="t-footnote c-3 text-center mt-6"><BookMarked size={12} /> 서재에 책을 추가하면 통계가 채워집니다.</p>
      )}
    </div>
  );
}
