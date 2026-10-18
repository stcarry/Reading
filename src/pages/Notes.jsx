import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Plus, Clock, Trash2, Pencil, Search, BookOpen, ListOrdered, FolderInput,
  Download, Printer, NotebookPen, BookMarked,
} from 'lucide-react';
import { getBooks, getNotes, addNote, updateNote, deleteNote } from '../data/store';
import {
  NOTE_TYPES, CATEGORIES, getNoteType, groupNotesByChapter,
  parseSections, buildSections, slugify,
} from '../utils/notes';
import { downloadBookNotesPdf, printBookNotes } from '../utils/pdfExport';
import { EmptyState, Modal, ConfirmDialog, PageSkeleton } from '../components/ui';

const UNASSIGNED = '__unassigned__';

const EMPTY_FORM = {
  bookId: '', type: 'keyword', chapter: '', keywords: '', content: '',
  what: '', soWhat: '', nowWhat: '',
  quote: '', page: '', reflection: '',
  week1: '', week2: '', week3: '', week4: '',
  category: 'knowledge',
};

function noteToForm(note) {
  const form = {
    ...EMPTY_FORM,
    bookId: note.bookId || '',
    type: note.type || 'keyword',
    chapter: note.chapter || '',
    keywords: (note.keywords || []).join(', '),
    content: note.content || '',
    category: note.category || 'knowledge',
  };
  const sections = parseSections(note.content) || [];
  const get = (label) => sections.find(s => s.label.startsWith(label))?.text || '';

  if (note.type === 'three_part') {
    const tp = note.threePart || {};
    form.what = tp.what || get('본 것');
    form.soWhat = tp.soWhat || get('깨달은 것');
    form.nowWhat = tp.nowWhat || get('적용할 것');
  } else if (note.type === 'quote') {
    form.quote = get('구절'); form.page = get('페이지'); form.reflection = get('나의 생각');
  } else if (note.type === 'action_plan') {
    form.week1 = get('1주차'); form.week2 = get('2주차'); form.week3 = get('3주차'); form.week4 = get('4주차');
  }
  return form;
}

function formToPayload(form) {
  let content = form.content;
  let threePart = null;
  if (form.type === 'three_part') {
    threePart = { what: form.what, soWhat: form.soWhat, nowWhat: form.nowWhat };
    content = buildSections([
      ['본 것 (What)', form.what], ['깨달은 것 (So What)', form.soWhat], ['적용할 것 (Now What)', form.nowWhat],
    ]);
  } else if (form.type === 'quote') {
    content = buildSections([['구절', form.quote], ['페이지', form.page], ['나의 생각', form.reflection]]);
  } else if (form.type === 'action_plan') {
    content = buildSections([['1주차', form.week1], ['2주차', form.week2], ['3주차', form.week3], ['4주차', form.week4]]);
  }
  return {
    bookId: form.bookId || null,
    type: form.type,
    chapter: form.chapter.trim(),
    keywords: form.keywords.split(/[,，]+/).map(k => k.trim()).filter(Boolean),
    content,
    category: form.category,
    threePart,
  };
}

function Markdown({ text }) {
  return (
    <div className="markdown nd-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || ''}</ReactMarkdown>
    </div>
  );
}

function NoteBody({ note }) {
  if (note.type === 'three_part') {
    const tp = note.threePart || {};
    const s = parseSections(note.content) || [];
    const get = (l) => s.find(x => x.label.startsWith(l))?.text || '';
    const parts = [
      { label: '본 것 · What', text: tp.what || get('본 것'), cls: 'what' },
      { label: '깨달은 것 · So What', text: tp.soWhat || get('깨달은 것'), cls: 'sowhat' },
      { label: '적용할 것 · Now What', text: tp.nowWhat || get('적용할 것'), cls: 'nowwhat' },
    ].filter(p => p.text);
    if (parts.length === 0) return <Markdown text={note.content} />;
    return (
      <div className="nd-sections">
        {parts.map(p => (
          <div key={p.cls} className={`nd-section nd-${p.cls}`}>
            <div className="nd-section-label">{p.label}</div>
            <div className="nd-section-text">{p.text}</div>
          </div>
        ))}
      </div>
    );
  }

  if (note.type === 'quote') {
    const s = parseSections(note.content) || [];
    const get = (l) => s.find(x => x.label === l)?.text || '';
    const quote = get('구절') || note.content;
    return (
      <div>
        <blockquote className="nd-quote">
          {quote}
          {get('페이지') && <span className="nd-quote-page">— {get('페이지')}</span>}
        </blockquote>
        {get('나의 생각') && <div className="nd-section-text mt-3">{get('나의 생각')}</div>}
      </div>
    );
  }

  const sections = parseSections(note.content);
  if (sections) {
    return (
      <div className={note.type === 'action_plan' ? 'nd-weeks' : 'nd-sections'}>
        {sections.map((s, i) => (
          <div key={i} className="nd-section">
            <div className="nd-section-label">{s.label}</div>
            <div className="nd-section-text">{s.text}</div>
          </div>
        ))}
      </div>
    );
  }
  return <Markdown text={note.content} />;
}

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(searchParams.get('bookId') || '');
  const [typeFilter, setTypeFilter] = useState('all');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [query, setQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState('');

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [bulkBookId, setBulkBookId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const [timer, setTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const docRef = useRef(null);

  const refresh = async () => {
    const [fetchedNotes, fetchedBooks] = await Promise.all([getNotes(), getBooks()]);
    setNotes(fetchedNotes); setBooks(fetchedBooks); setLoaded(true);
  };

  useEffect(() => {
    refresh();
    const onChange = (e) => { if (!e.detail || e.detail.key === 'rg_notes') refresh(); };
    window.addEventListener('rg-data-change', onChange);
    return () => window.removeEventListener('rg-data-change', onChange);
  }, []);

  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { setTimer(false); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const bookTabs = useMemo(() => {
    const map = new Map();
    for (const n of notes) {
      const key = n.bookId && books.some(b => b.id === n.bookId) ? n.bookId : UNASSIGNED;
      const prev = map.get(key) || { count: 0, last: 0 };
      map.set(key, { count: prev.count + 1, last: Math.max(prev.last, new Date(n.createdAt).getTime()) });
    }
    const tabs = [...map.entries()]
      .filter(([k]) => k !== UNASSIGNED)
      .map(([id, v]) => ({ id, book: books.find(b => b.id === id), ...v }))
      .sort((a, b) => b.last - a.last);
    const unassigned = map.get(UNASSIGNED);
    return { tabs, unassigned: unassigned?.count || 0 };
  }, [notes, books]);

  useEffect(() => {
    if (!loaded) return;
    const valid = selectedBookId === UNASSIGNED ? bookTabs.unassigned > 0 : bookTabs.tabs.some(t => t.id === selectedBookId);
    if (!valid) setSelectedBookId(bookTabs.tabs[0]?.id || (bookTabs.unassigned ? UNASSIGNED : ''));
  }, [loaded, bookTabs, selectedBookId]);

  const selectBook = (id) => {
    setSelectedBookId(id); setKeywordFilter(''); setTypeFilter('all'); setQuery('');
    setSearchParams(id && id !== UNASSIGNED ? { bookId: id } : {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedBook = books.find(b => b.id === selectedBookId);

  const bookNotes = useMemo(() => notes.filter(n => {
    const assigned = n.bookId && books.some(b => b.id === n.bookId);
    return selectedBookId === UNASSIGNED ? !assigned : n.bookId === selectedBookId;
  }), [notes, books, selectedBookId]);

  const keywordStats = useMemo(() => {
    const counts = {};
    bookNotes.forEach(n => (n.keywords || []).forEach(k => { counts[k] = (counts[k] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [bookNotes]);

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookNotes.filter(n =>
      (typeFilter === 'all' || n.type === typeFilter) &&
      (!keywordFilter || (n.keywords || []).includes(keywordFilter)) &&
      (!q || [n.chapter, n.content, ...(n.keywords || [])].join(' ').toLowerCase().includes(q))
    );
  }, [bookNotes, typeFilter, keywordFilter, query]);

  const chapters = useMemo(() => groupNotesByChapter(visibleNotes), [visibleNotes]);
  const presentTypes = useMemo(() => new Set(bookNotes.map(n => n.type)), [bookNotes]);

  useEffect(() => {
    if (!docRef.current) return;
    const sections = docRef.current.querySelectorAll('[data-chapter]');
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveChapter(visible[0].target.dataset.chapter);
    }, { rootMargin: '-15% 0px -70% 0px' });
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [chapters]);

  const scrollToChapter = (name) => {
    document.getElementById(slugify(name))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chapterSuggestions = useMemo(() => {
    const set = new Set(notes.filter(n => n.bookId === form.bookId).map(n => n.chapter).filter(Boolean));
    (books.find(b => b.id === form.bookId)?.chapters || []).forEach(c => set.add(c));
    return [...set];
  }, [notes, books, form.bookId]);

  const openAdd = (chapter = '') => {
    setForm({ ...EMPTY_FORM, bookId: selectedBookId !== UNASSIGNED ? selectedBookId : '', chapter });
    setModal({ mode: 'add' });
  };
  const openEdit = (note) => { setForm(noteToForm(note)); setModal({ mode: 'edit', noteId: note.id }); };
  const closeModal = () => { setModal(null); setTimer(false); setTimeLeft(600); };

  const payloadPreview = formToPayload(form);
  const canSave = payloadPreview.content.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (modal.mode === 'edit') await updateNote(modal.noteId, payloadPreview);
      else await addNote(payloadPreview);
      await refresh();
      if (payloadPreview.bookId && payloadPreview.bookId !== selectedBookId) selectBook(payloadPreview.bookId);
      closeModal();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteNote(deleteId);
    setDeleteId(null);
    await refresh();
  };

  const handleBulkAssign = async () => {
    if (!bulkBookId) return;
    for (const n of bookNotes) await updateNote(n.id, { bookId: bulkBookId });
    setBulkConfirm(false);
    await refresh();
    selectBook(bulkBookId);
  };

  const handlePdfDownload = async () => {
    if (isExporting || bookNotes.length === 0) return;
    setIsExporting(true);
    try { await downloadBookNotesPdf(selectedBook, chapters, bookNotes); }
    catch (err) { console.error('PDF export failed:', err); alert('PDF 생성 중 오류가 발생했습니다: ' + (err.message || '다시 시도해주세요.')); }
    finally { setIsExporting(false); }
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

  if (!loaded) return <PageSkeleton rows={2} />;

  return (
    <div className="page-container notes-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">기록 노트</h1>
          <p className="page-subtitle">책별로, 챕터 순서대로 — 읽은 흐름 그대로 다시 읽는 나의 독서 기록</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handlePdfDownload} disabled={isExporting || bookNotes.length === 0} title="현재 책의 기록을 PDF로 저장" id="download-pdf-btn">
            <Download size={15} /> {isExporting ? '생성 중…' : 'PDF'}
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => printBookNotes(selectedBook?.title)} disabled={bookNotes.length === 0} title="인쇄" id="print-notes-btn" aria-label="인쇄">
            <Printer size={15} />
          </button>
          <button className="btn btn-primary" onClick={() => openAdd()} id="add-note-btn"><Plus size={16} /> 새 기록</button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={24} />}
          title="아직 기록이 없어요"
          desc={<>AI 코칭 3단계(중간점검)에서 챕터 요약을 남기면 자동으로 여기에 쌓입니다.<br />“기억나지 않는 독서는 읽지 않은 것과 같습니다.” — 김익환</>}
          action={<button className="btn btn-tinted" onClick={() => openAdd()}><Plus size={16} /> 첫 기록 남기기</button>}
        />
      ) : (
        <>
          {/* 책 선택 */}
          <div className="nb-shelf" role="tablist" aria-label="도서 선택">
            {bookTabs.tabs.map(({ id, book, count }) => (
              <button key={id} role="tab" aria-selected={selectedBookId === id} className={`nb-book ${selectedBookId === id ? 'active' : ''}`} onClick={() => selectBook(id)} id={`notes-book-${id}`}>
                <div className="cover">{book?.cover ? <img src={book.cover} alt="" /> : <BookMarked size={14} />}</div>
                <div className="flex-1">
                  <div className="nb-title">{book?.title}</div>
                  <div className="nb-count">기록 {count}개</div>
                </div>
              </button>
            ))}
            {bookTabs.unassigned > 0 && (
              <button role="tab" aria-selected={selectedBookId === UNASSIGNED} className={`nb-book nb-unassigned ${selectedBookId === UNASSIGNED ? 'active' : ''}`} onClick={() => selectBook(UNASSIGNED)} id="notes-book-unassigned">
                <div className="cover"><FolderInput size={14} /></div>
                <div className="flex-1">
                  <div className="nb-title">책 미지정</div>
                  <div className="nb-count">기록 {bookTabs.unassigned}개</div>
                </div>
              </button>
            )}
          </div>

          {selectedBookId === UNASSIGNED && bookNotes.length > 0 && (
            <div className="card pad-sm nb-assign">
              <FolderInput size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div className="flex-1" style={{ minWidth: 200 }}>
                <div className="t-subhead" style={{ fontWeight: 600 }}>책이 지정되지 않은 기록이 {bookNotes.length}개 있어요.</div>
                <div className="t-footnote c-2">한 번에 분류하거나, 각 기록의 편집 버튼으로 개별 지정할 수 있습니다.</div>
              </div>
              <select className="select" value={bulkBookId} onChange={e => setBulkBookId(e.target.value)} id="bulk-assign-select">
                <option value="">책 선택…</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <button className="btn btn-tinted" disabled={!bulkBookId} onClick={() => setBulkConfirm(true)} id="bulk-assign-btn">모두 이 책으로 분류</button>
            </div>
          )}

          {/* 도구 */}
          <div className="nt-toolbar">
            <div className="search-field">
              <Search size={14} />
              <input placeholder="이 책의 기록에서 검색" value={query} onChange={e => setQuery(e.target.value)} id="notes-search" />
            </div>
            <div className="chip-scroll">
              <button className={`chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>전체</button>
              {NOTE_TYPES.filter(t => presentTypes.has(t.key)).map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} className={`chip ${typeFilter === t.key ? 'active' : ''}`} onClick={() => setTypeFilter(t.key)}>
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {keywordStats.length > 0 && (
            <div className="nt-keywords">
              <span className="nt-keywords-label">키워드</span>
              {keywordStats.map(([kw, count]) => (
                <button key={kw} className={`nt-kw ${keywordFilter === kw ? 'active' : ''}`} onClick={() => setKeywordFilter(keywordFilter === kw ? '' : kw)}>
                  #{kw}{count > 1 && <span>{count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* 목차 + 본문 */}
          <div className="nd-layout">
            <aside className="nd-toc" aria-label="챕터 목차">
              <div className="nd-toc-head"><ListOrdered size={13} /> 목차 <span>{chapters.length}개 챕터</span></div>
              <ol>
                {chapters.map((ch, i) => (
                  <li key={ch.name}>
                    <button className={activeChapter === ch.name ? 'active' : ''} onClick={() => scrollToChapter(ch.name)}>
                      <span className="nd-toc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="nd-toc-name">{ch.name}</span>
                      {ch.notes.length > 1 && <span className="nd-toc-count">{ch.notes.length}</span>}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="nd-toc-hint">챕터명에 번호(예: 3장, Part 2)가 있으면 번호 순, 없으면 작성한 순서대로 정렬됩니다.</p>
            </aside>

            <article className="nd-doc" ref={docRef}>
              {(selectedBook || selectedBookId === UNASSIGNED) && (
                <header className="nd-doc-head">
                  <div className="flex-1">
                    <div className="nd-doc-kicker">독서 기록</div>
                    <h2>{selectedBook?.title || '책 미지정 기록'}</h2>
                    {selectedBook?.author && <div className="nd-doc-author">{selectedBook.author}</div>}
                    <div className="nd-doc-stats">
                      챕터 {groupNotesByChapter(bookNotes).length} · 기록 {bookNotes.length}
                      {bookNotes.length > 0 && <> · {fmtDate(bookNotes.reduce((a, n) => n.createdAt < a ? n.createdAt : a, bookNotes[0].createdAt))} 시작</>}
                    </div>
                  </div>
                  {selectedBook?.cover && <div className="cover cover-md"><img src={selectedBook.cover} alt="" /></div>}
                </header>
              )}

              {chapters.length === 0 && (
                <div className="empty"><div className="empty-desc">조건에 맞는 기록이 없어요.</div></div>
              )}

              {chapters.map((ch, i) => {
                const chapterKeywords = [...new Set(ch.notes.flatMap(n => n.keywords || []))];
                return (
                  <section key={ch.name} id={slugify(ch.name)} data-chapter={ch.name} className="nd-chapter">
                    <div className="nd-chapter-head">
                      <span className="nd-chapter-num">{String(i + 1).padStart(2, '0')}</span>
                      <h3>{ch.name}</h3>
                      <button className="btn btn-ghost btn-sm btn-icon nd-chapter-add" onClick={() => openAdd(ch.name === '챕터 미지정' ? '' : ch.name)} title="이 챕터에 기록 추가" aria-label="이 챕터에 기록 추가">
                        <Plus size={14} />
                      </button>
                    </div>
                    {chapterKeywords.length > 0 && (
                      <div className="nd-chapter-kws">{chapterKeywords.map(k => <span key={k}>#{k}</span>)}</div>
                    )}
                    {ch.notes.map(note => {
                      const t = getNoteType(note.type);
                      const Icon = t?.icon;
                      return (
                        <div key={note.id} className="nd-entry">
                          <div className="nd-entry-meta">
                            <span className="nd-type">{Icon && <Icon size={12} />}{t ? t.label : note.type}</span>
                            <span className="nd-date">{fmtDate(note.createdAt)}</span>
                            <div className="nd-entry-actions">
                              <button onClick={() => openEdit(note)} title="편집" aria-label="편집"><Pencil size={13} /></button>
                              <button onClick={() => setDeleteId(note.id)} title="삭제" aria-label="삭제" className="danger"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <NoteBody note={note} />
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </article>
          </div>
        </>
      )}

      {/* 작성 / 편집 */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'edit' ? '기록 편집' : '새 기록'}
        labelledBy="note-modal-title"
        size="modal-lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>취소</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || saving} id="note-save-btn">
              {saving ? '저장 중…' : modal?.mode === 'edit' ? '변경 저장' : '기록 저장'}
            </button>
          </>
        }
      >
        <div className="field-row">
          <div className="field">
            <label htmlFor="note-book-select">도서</label>
            <select id="note-book-select" className="select" value={form.bookId} onChange={f('bookId')}>
              <option value="">선택하지 않음</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="note-chapter-input">챕터</label>
            <input id="note-chapter-input" className="input" list="chapter-suggestions" placeholder="예: 3장 운동 기억" value={form.chapter} onChange={f('chapter')} />
            <datalist id="chapter-suggestions">{chapterSuggestions.map(c => <option key={c} value={c} />)}</datalist>
          </div>
        </div>

        <div className="field">
          <label>기록 유형</label>
          <div className="nm-types" role="radiogroup">
            {NOTE_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} type="button" role="radio" aria-checked={form.type === t.key} className={`nm-type ${form.type === t.key ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, type: t.key }))} title={t.desc}>
                  <Icon size={14} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {form.type === 'three_part' ? (
          <div className="field">
            <label>3단 구조 <small>AI 초안은 반드시 내 언어로 고쳐 쓰세요</small></label>
            <div className="field-stack">
              <textarea className="textarea" placeholder="본 것 (What) — 저자가 무엇을 말했는가?" value={form.what} onChange={f('what')} />
              <textarea className="textarea" placeholder="깨달은 것 (So What) — 이게 나에게 왜 중요한가?" value={form.soWhat} onChange={f('soWhat')} />
              <textarea className="textarea" placeholder="적용할 것 (Now What) — 그래서 무엇을 할 것인가?" value={form.nowWhat} onChange={f('nowWhat')} />
            </div>
          </div>
        ) : form.type === 'quote' ? (
          <div className="field">
            <label>인상 깊은 구절</label>
            <div className="field-stack">
              <textarea className="textarea" placeholder="책 속 문장을 그대로 옮겨 적으세요" value={form.quote} onChange={f('quote')} style={{ minHeight: 90 }} />
              <input className="input" placeholder="페이지 (예: p.142)" value={form.page} onChange={f('page')} />
              <textarea className="textarea" placeholder="이 구절이 왜 마음에 남았나요?" value={form.reflection} onChange={f('reflection')} style={{ minHeight: 80 }} />
            </div>
          </div>
        ) : form.type === 'action_plan' ? (
          <div className="field">
            <label>30일 실천 계획</label>
            <div className="field-stack">
              {['week1', 'week2', 'week3', 'week4'].map((w, i) => (
                <input key={w} className="input" placeholder={`${i + 1}주차 — 무엇을 해볼까요?`} value={form[w]} onChange={f(w)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="field">
            <label>
              <span>내용 {form.type === 'chapter_summary' && <small>A4 반쪽 이내</small>}</span>
              {form.type === 'chapter_summary' && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setTimeLeft(600); setTimer(true); }}>
                  <Clock size={13} />
                  {timer ? <span className={`timer-live ${timeLeft < 60 ? 'urgent' : ''}`}>{formatTime(timeLeft)}</span> : '10분 타이머'}
                </button>
              )}
            </label>
            <textarea className="textarea"
              placeholder={form.type === 'full_summary' ? '전체 내용을 A4 2-3장 분량으로 재정리하세요' : '책을 덮고, 기억에 의존해 내 언어로 정리하세요'}
              value={form.content} onChange={f('content')}
              style={{ minHeight: form.type === 'full_summary' ? 260 : 160 }} />
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="note-keywords-input">키워드 <small>쉼표로 구분</small></label>
            <input id="note-keywords-input" className="input" placeholder="예: 운동 학습, 피드백" value={form.keywords} onChange={f('keywords')} />
          </div>
          <div className="field">
            <label htmlFor="note-category">영역</label>
            <select id="note-category" className="select" value={form.category} onChange={f('category')}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label} — {c.desc}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        icon={<Trash2 size={22} />}
        danger
        title="이 기록을 삭제할까요?"
        desc="삭제한 기록은 되돌릴 수 없습니다."
        confirmLabel="삭제"
      />
      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkAssign}
        icon={<FolderInput size={22} />}
        title={`기록 ${bookNotes.length}개를 분류할까요?`}
        desc={`「${books.find(b => b.id === bulkBookId)?.title}」의 기록으로 지정합니다.`}
        confirmLabel="분류"
      />
    </div>
  );
}
