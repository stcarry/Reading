import { useState, useEffect } from 'react';
import {
  Plus, X, Key, FileText, BookCheck,
  Tag, Clock, Trash2, Filter, Layers
} from 'lucide-react';
import { getBooks, getNotes, addNote, deleteNote } from '../data/store';

const CATEGORIES = [
  { key: 'knowledge', label: '📖 지식', desc: '책/강의에서 깨달은 것' },
  { key: 'conversation', label: '💬 대화', desc: '대화 중 영감 얻은 것' },
  { key: 'work', label: '💼 일', desc: '일 관련 노하우' },
  { key: 'daily', label: '🌅 일상', desc: '일상 기록과 감정' },
  { key: 'thought', label: '💡 생각', desc: '떠오른 아이디어' },
];

const NOTE_TYPES = [
  { key: 'keyword', label: '🔑 키워드 노트', desc: '핵심 키워드 2개 추출' },
  { key: 'chapter_summary', label: '📄 챕터 요약', desc: 'A4 반쪽 이내 요약' },
  { key: 'three_part', label: '📐 3단 구조', desc: 'What/So What/Now What' },
  { key: 'full_summary', label: '📋 전체 요약', desc: 'A4 2-3장 분량 재정리' },
];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [activeBookFilter, setActiveBookFilter] = useState('all');

  const [form, setForm] = useState({
    bookId: '',
    type: 'keyword',
    chapter: '',
    keyword1: '',
    keyword2: '',
    content: '',
    whatContent: '',
    soWhatContent: '',
    nowWhatContent: '',
    category: 'knowledge',
  });

  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const [fetchedNotes, fetchedBooks] = await Promise.all([
      getNotes(),
      getBooks()
    ]);
    setNotes(fetchedNotes);
    setBooks(fetchedBooks);
  };

  useEffect(() => {
    const handleDataChange = (e) => {
      if (!e.detail || e.detail.key === 'rg_notes') {
        refresh();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'rg_notes' || e.key === null) {
        refresh();
      }
    };

    window.addEventListener('rg-data-change', handleDataChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('rg-data-change', handleDataChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (timer) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);



  const handleAdd = async () => {
    let content = form.content;
    
    // 3단 구조일 경우 구조화된 내용 조합
    if (form.type === 'three_part') {
      if (!form.whatContent.trim() && !form.soWhatContent.trim() && !form.nowWhatContent.trim()) return;
      content = `【본 것 (What)】\n${form.whatContent}\n\n【깨달은 것 (So What)】\n${form.soWhatContent}\n\n【적용할 것 (Now What)】\n${form.nowWhatContent}`;
    } else if (!content.trim()) return;
    
    const keywords = [form.keyword1, form.keyword2].filter(k => k.trim());
    
    await addNote({
      bookId: form.bookId,
      type: form.type,
      chapter: form.chapter,
      keywords,
      content,
      category: form.category,
      threePart: form.type === 'three_part' ? {
        what: form.whatContent,
        soWhat: form.soWhatContent,
        nowWhat: form.nowWhatContent,
      } : undefined,
    });
    
    await refresh();
    setShowAddModal(false);
    setForm({
      bookId: '', type: 'keyword', chapter: '', keyword1: '', keyword2: '',
      content: '', whatContent: '', soWhatContent: '', nowWhatContent: '', category: 'knowledge',
    });
    setTimer(null);
    setTimeLeft(600);
  };

  const handleDelete = async (id) => {
    if (confirm('이 기록을 삭제할까요?')) {
      await deleteNote(id);
      await refresh();
    }
  };

  const startTimer = () => {
    setTimeLeft(600);
    setTimer(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  let filteredNotes = notes;
  if (activeFilter !== 'all') {
    filteredNotes = filteredNotes.filter(n => n.type === activeFilter);
  }
  if (activeCategoryFilter !== 'all') {
    filteredNotes = filteredNotes.filter(n => n.category === activeCategoryFilter);
  }
  if (activeBookFilter !== 'all') {
    filteredNotes = filteredNotes.filter(n => n.bookId === activeBookFilter);
  }
  filteredNotes = filteredNotes.slice().reverse();

  const allKeywords = notes.reduce((acc, n) => {
    (n.keywords || []).forEach(kw => {
      const existing = acc.find(a => a.word === kw);
      if (existing) existing.count++;
      else acc.push({ word: kw, count: 1 });
    });
    return acc;
  }, []).sort((a, b) => b.count - a.count);

  // Render 3-part note content
  const renderNoteContent = (note) => {
    if (note.threePart || note.type === 'three_part') {
      const tp = note.threePart || {};
      // Parse from content if threePart object doesn't exist
      let whatText = tp.what || '';
      let soWhatText = tp.soWhat || '';
      let nowWhatText = tp.nowWhat || '';
      
      if (!whatText && note.content) {
        const parts = note.content.split(/【.*?】\n?/);
        if (parts.length >= 4) {
          whatText = parts[1]?.trim();
          soWhatText = parts[2]?.trim();
          nowWhatText = parts[3]?.trim();
        }
      }

      return (
        <div className="three-part-display">
          <div className="three-part-section">
            <div className="three-part-label" style={{ color: 'var(--teal-400)' }}>
              📝 본 것 (What)
            </div>
            <div className="three-part-content">{whatText || note.content}</div>
          </div>
          <div className="three-part-section">
            <div className="three-part-label" style={{ color: 'var(--amber-400)' }}>
              💡 깨달은 것 (So What)
            </div>
            <div className="three-part-content">{soWhatText}</div>
          </div>
          <div className="three-part-section">
            <div className="three-part-label" style={{ color: 'var(--green-400)' }}>
              🎯 적용할 것 (Now What)
            </div>
            <div className="three-part-content">{nowWhatText}</div>
          </div>
        </div>
      );
    }
    return <div className="note-card-preview" style={{ WebkitLineClamp: 'unset' }}>{note.content}</div>;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">기록 노트 📝</h1>
            <p className="page-subtitle">
              거인의 기록법 — 키워드 추출, 요약, 3단 구조로 지식을 자기화하세요
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-note-btn">
            <Plus size={16} /> 새 기록
          </button>
        </div>
      </div>

      {/* Keyword Cloud */}
      {allKeywords.length > 0 && (
        <div className="glass-card-static mb-6" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            🔑 나의 키워드 맵
          </h3>
          <div className="keyword-cloud" style={{ padding: 0 }}>
            {allKeywords.map((kw, i) => (
              <span key={i} className="keyword-tag" style={{
                fontSize: `${Math.min(14 + kw.count * 2, 20)}px`,
                opacity: 0.5 + Math.min(kw.count * 0.15, 0.5),
              }}>
                {kw.word} ({kw.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Book Filter */}
        {books.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <BookCheck size={12} /> 도서별 분류
            </div>
            <div className="tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', background: 'transparent', padding: 0 }}>
              <button
                className={`tab ${activeBookFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveBookFilter('all')}
                style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px' }}
              >
                전체 도서
              </button>
              {books.map(b => (
                <button
                  key={b.id}
                  className={`tab ${activeBookFilter === b.id ? 'active' : ''}`}
                  onClick={() => setActiveBookFilter(b.id)}
                  style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px' }}
                >
                  {b.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>유형별</div>
            <div className="tabs" style={{ width: 'fit-content' }}>
              <button className={`tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>전체</button>
              {NOTE_TYPES.map(t => (
                <button key={t.key} className={`tab ${activeFilter === t.key ? 'active' : ''}`} onClick={() => setActiveFilter(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>5영역 분류</div>
            <div className="tabs" style={{ width: 'fit-content' }}>
              <button className={`tab ${activeCategoryFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveCategoryFilter('all')}>전체</button>
              {CATEGORIES.map(c => (
                <button key={c.key} className={`tab ${activeCategoryFilter === c.key ? 'active' : ''}`} onClick={() => setActiveCategoryFilter(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">아직 기록이 없어요</div>
          <div className="empty-state-desc">
            책을 읽으며 핵심 키워드를 추출하고, 3단 구조로 정리하며 지식을 쌓아보세요.
            "기억나지 않는 독서는 읽지 않은 것과 같습니다." - 김익환
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> 첫 기록 남기기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger-children">
          {filteredNotes.map(note => {
            const book = books.find(b => b.id === note.bookId);
            const noteType = NOTE_TYPES.find(t => t.key === note.type);
            const category = CATEGORIES.find(c => c.key === note.category);
            return (
              <div key={note.id} className="glass-card note-card">
                <div className="note-card-header">
                  <div className="flex items-center gap-2">
                    {book && <span className="tag tag-amber">{book.title}</span>}
                    {noteType && <span className="tag tag-teal">{noteType.label}</span>}
                    {note.chapter && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>· {note.chapter}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="note-card-date">{new Date(note.createdAt).toLocaleDateString('ko-KR')}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(note.id)} style={{ color: 'var(--rose-400)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {note.keywords?.length > 0 && (
                  <div className="note-card-keywords">
                    {note.keywords.map((kw, i) => (
                      <span key={i} className="tag tag-violet" style={{ fontSize: 'var(--text-sm)' }}>🔑 {kw}</span>
                    ))}
                  </div>
                )}
                {renderNoteContent(note)}
                {category && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <span className="tag tag-green">{category.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">📝 새 기록 작성</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Note Type */}
              <div className="mb-4">
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>
                  기록 유형
                </label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {NOTE_TYPES.map(t => (
                    <button key={t.key}
                      className={`btn ${form.type === t.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setForm(f => ({ ...f, type: t.key }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Selection */}
              <div className="mb-4">
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>관련 도서</label>
                <select className="input" value={form.bookId} onChange={(e) => setForm(f => ({ ...f, bookId: e.target.value }))}
                  style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <option value="">선택하지 않음</option>
                  {books.map(b => (<option key={b.id} value={b.id}>{b.title}</option>))}
                </select>
              </div>

              {/* Chapter */}
              <div className="mb-4">
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>챕터 / 주제</label>
                <input className="input" placeholder="예: 인지 혁명, 3장, p.56-78"
                  value={form.chapter} onChange={(e) => setForm(f => ({ ...f, chapter: e.target.value }))} />
              </div>

              {/* Keywords */}
              <div className="mb-4">
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>
                  🔑 핵심 키워드 2개 (고강도 요약)
                </label>
                <div className="flex gap-3">
                  <input className="input" placeholder="키워드 1" value={form.keyword1}
                    onChange={(e) => setForm(f => ({ ...f, keyword1: e.target.value }))} style={{ flex: 1 }} />
                  <input className="input" placeholder="키워드 2" value={form.keyword2}
                    onChange={(e) => setForm(f => ({ ...f, keyword2: e.target.value }))} style={{ flex: 1 }} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  "버릴 수 있는 용기야말로 기록형 인간이 되는 조건" - 김익환
                </div>
              </div>

              {/* Content - conditional by type */}
              {form.type === 'three_part' ? (
                <div className="mb-4">
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-3)' }}>
                    📐 3단 구조 (What / So What / Now What)
                  </label>
                  <div style={{
                    padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7,
                  }}>
                    💡 AI가 작성한 초안은 반드시 '내 언어'와 '내 말투'로 고쳐 쓰세요!
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--teal-400)', marginBottom: '4px' }}>
                        📝 본 것 (What/Fact) — "저자가 무엇을 말했는가?"
                      </div>
                      <textarea className="textarea" placeholder="객관적인 사실 요약: 책의 핵심 내용, 저자의 주장"
                        value={form.whatContent} onChange={(e) => setForm(f => ({ ...f, whatContent: e.target.value }))}
                        style={{ minHeight: 80 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--amber-400)', marginBottom: '4px' }}>
                        💡 깨달은 것 (So What/Insight) — "이게 나에게 왜 중요한가?"
                      </div>
                      <textarea className="textarea" placeholder="나의 주관적인 해석: 새롭게 알게 된 점, 통찰"
                        value={form.soWhatContent} onChange={(e) => setForm(f => ({ ...f, soWhatContent: e.target.value }))}
                        style={{ minHeight: 80 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--green-400)', marginBottom: '4px' }}>
                        🎯 적용할 것 (Now What/Action) — "그래서 무엇을 할 것인가?"
                      </div>
                      <textarea className="textarea" placeholder="구체적인 행동 계획: 내 삶에 적용할 포인트"
                        value={form.nowWhatContent} onChange={(e) => setForm(f => ({ ...f, nowWhatContent: e.target.value }))}
                        style={{ minHeight: 80 }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      내용 {form.type === 'chapter_summary' && '(A4 반쪽 이내)'}
                    </label>
                    {form.type === 'chapter_summary' && (
                      <button className="btn btn-secondary btn-sm" onClick={startTimer}>
                        <Clock size={14} />
                        {timer ? (
                          <span style={{ color: timeLeft < 60 ? 'var(--rose-400)' : 'var(--amber-400)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(timeLeft)}
                          </span>
                        ) : '10분 타이머'}
                      </button>
                    )}
                  </div>
                  <textarea className="textarea"
                    placeholder={
                      form.type === 'keyword' ? '키워드와 관련된 핵심 내용을 자기 언어로 정리하세요'
                      : form.type === 'chapter_summary' ? '챕터의 핵심을 요약하세요. 10분 이내로!'
                      : '전체 내용을 A4 2-3장 분량으로 재정리하세요'
                    }
                    value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                    style={{ minHeight: form.type === 'full_summary' ? 250 : 150 }} />
                </div>
              )}

              {/* Category */}
              <div className="mb-4">
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>5영역 분류</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.key}
                      className={`btn ${form.category === c.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setForm(f => ({ ...f, category: c.key }))} title={c.desc}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd}
                disabled={form.type === 'three_part'
                  ? (!form.whatContent.trim() && !form.soWhatContent.trim() && !form.nowWhatContent.trim())
                  : !form.content.trim()
                }>
                기록 저장
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .three-part-display {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-top: var(--space-3);
        }
        .three-part-section {
          padding: var(--space-3) var(--space-4);
          background: var(--bg-card);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--border-subtle);
        }
        .three-part-section:nth-child(1) { border-left-color: var(--teal-400); }
        .three-part-section:nth-child(2) { border-left-color: var(--amber-400); }
        .three-part-section:nth-child(3) { border-left-color: var(--green-400); }
        .three-part-label {
          font-size: var(--text-xs);
          font-weight: 700;
          margin-bottom: var(--space-1);
        }
        .three-part-content {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.7;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
