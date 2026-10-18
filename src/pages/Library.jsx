import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, BookMarked, Star, Trash2, ExternalLink, Ellipsis, BookOpen, Check,
} from 'lucide-react';
import { getBooks, addBook, updateBook, deleteBook, searchBooks, onAuthStateChange } from '../data/store';
import { Segmented, EmptyState, Modal, ConfirmDialog, Menu, MenuItem } from '../components/ui';

const STATUS = {
  want: { label: '읽고 싶은', cls: 'want' },
  reading: { label: '읽는 중', cls: 'reading' },
  done: { label: '완독', cls: 'done' },
};
const STATUS_ORDER = ['want', 'reading', 'done'];

export default function Library() {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', author: '', totalPages: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (_event, user) => {
      if (user) setBooks(await getBooks());
      else setBooks([]);
    });
    getBooks().then(setBooks);
    return () => { subscription?.unsubscribe(); };
  }, []);

  const refresh = async () => setBooks(await getBooks());

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try { setSearchResults(await searchBooks(searchQuery)); }
    finally { setIsSearching(false); }
  }, [searchQuery]);

  const closeAdd = () => {
    setShowAddModal(false);
    setSearchQuery(''); setSearchResults([]);
    setManualForm({ title: '', author: '', totalPages: '' }); setManualMode(false);
  };

  const handleAddFromSearch = async (result) => {
    try {
      await addBook({
        title: result.title, author: result.author, cover: result.cover,
        isbn: result.isbn, totalPages: result.totalPages, description: result.description,
      });
      await refresh();
      closeAdd();
    } catch (err) {
      console.error('Failed to add book:', err);
      alert('도서 추가에 실패했습니다: ' + err.message);
    }
  };

  const handleAddManual = async () => {
    if (!manualForm.title.trim()) return;
    try {
      await addBook({ title: manualForm.title, author: manualForm.author, totalPages: parseInt(manualForm.totalPages) || 0 });
      await refresh();
      closeAdd();
    } catch (err) {
      alert('도서 추가 실패: ' + err.message);
    }
  };

  const handleStatusChange = async (book, status) => {
    if (book.status === status) return;
    const updates = { status };
    if (status === 'reading' && !book?.startDate) updates.start_date = new Date().toISOString().split('T')[0];
    if (status === 'done' && !book?.end_date) updates.end_date = new Date().toISOString().split('T')[0];
    try { await updateBook(book.id, updates); await refresh(); }
    catch (err) { alert('상태 변경 실패: ' + err.message); }
  };

  const setPage = async (book, page) => {
    const val = Math.min(Math.max(0, page), book.totalPages || 99999);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, currentPage: val } : b));
    await updateBook(book.id, { current_page: val });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try { await deleteBook(deleteConfirmId); await refresh(); }
    finally { setDeleting(false); setDeleteConfirmId(null); }
  };

  const count = (s) => books.filter(b => b.status === s).length;
  const filteredBooks = activeTab === 'all' ? books : books.filter(b => b.status === activeTab);
  const kyobo = (isbn) => `https://search.kyobobook.co.kr/search?keyword=${isbn}`;

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">내 서재</h1>
          <p className="page-subtitle">{books.length > 0 ? `${books.length}권 · 읽는 중 ${count('reading')} · 완독 ${count('done')}` : '읽고 있는 책, 완독한 책, 읽고 싶은 책을 관리하세요'}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-book-btn">
            <Plus size={16} /> 책 추가
          </button>
        </div>
      </div>

      <div className="lib-toolbar">
        <Segmented
          ariaLabel="상태 필터"
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '전체', count: books.length },
            { key: 'reading', label: '읽는 중', count: count('reading') },
            { key: 'done', label: '완독', count: count('done') },
            { key: 'want', label: '읽고 싶은', count: count('want') },
          ]}
        />
      </div>

      {filteredBooks.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title={books.length === 0 ? '아직 책이 없어요' : '해당하는 책이 없어요'}
          desc={books.length === 0 ? '첫 번째 책을 등록하면 코칭과 기록이 시작됩니다.' : '다른 상태를 선택하거나 새 책을 추가해보세요.'}
          action={<button className="btn btn-tinted" onClick={() => setShowAddModal(true)}><Plus size={16} /> 책 추가</button>}
        />
      ) : (
        <div className="book-grid">
          {filteredBooks.map(book => {
            const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
            const st = STATUS[book.status] || STATUS.want;
            return (
              <article key={book.id} className="book-card">
                <div className="cover">
                  {book.cover ? <img src={book.cover} alt={book.title} loading="lazy" /> : <BookMarked size={28} />}
                </div>
                <div className="book-more">
                  <Menu trigger={<button className="btn" aria-label="더 보기"><Ellipsis size={16} /></button>}>
                    <div className="menu-label">상태</div>
                    {STATUS_ORDER.map(s => (
                      <MenuItem key={s} label={STATUS[s].label} checked={book.status === s} icon={book.status === s ? <Check size={14} /> : <span style={{ width: 14 }} />} onClick={() => handleStatusChange(book, s)} />
                    ))}
                    {book.isbn && (
                      <>
                        <div className="menu-sep" />
                        <MenuItem icon={<ExternalLink size={14} />} label="교보문고에서 보기" onClick={() => window.open(kyobo(book.isbn), '_blank', 'noopener')} />
                      </>
                    )}
                    <div className="menu-sep" />
                    <MenuItem icon={<Trash2 size={14} />} label="서재에서 삭제" danger onClick={() => setDeleteConfirmId(book.id)} />
                  </Menu>
                </div>
                <div className="book-meta">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{book.author}</div>
                  <div className={`book-status ${st.cls}`}>
                    <span className="dot" />{st.label}
                    {book.rating > 0 && <span className="flex items-center gap-1" style={{ marginLeft: 6 }}><Star size={10} fill="currentColor" /> {book.rating}</span>}
                  </div>
                  {book.status === 'reading' && (
                    <>
                      <div className="progress thin mt-2"><i style={{ width: `${progress}%` }} /></div>
                      <div className="book-progress-row">
                        <input
                          className="input" type="number" min="0" max={book.totalPages || 99999}
                          value={book.currentPage}
                          onChange={(e) => setPage(book, parseInt(e.target.value) || 0)}
                          aria-label="현재 페이지"
                        />
                        <span className="num">/ {book.totalPages}p</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPage(book, (book.currentPage || 0) + 10)} title="10페이지 추가">+10</button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 책 추가 */}
      <Modal open={showAddModal} onClose={closeAdd} title="책 추가" labelledBy="add-book-title">
        <div className="mb-4">
          <Segmented
            ariaLabel="추가 방식"
            value={manualMode ? 'manual' : 'search'}
            onChange={(k) => setManualMode(k === 'manual')}
            items={[{ key: 'search', label: '검색' }, { key: 'manual', label: '직접 입력' }]}
          />
        </div>

        {!manualMode ? (
          <>
            <div className="flex gap-2">
              <div className="search-field flex-1">
                <Search size={15} />
                <input
                  placeholder="책 제목이나 저자 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  id="book-search-input"
                  autoFocus
                />
              </div>
              <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? '검색 중…' : '검색'}
              </button>
            </div>

            <div className="search-results">
              {searchResults.map((result, idx) => (
                <div key={idx} className="search-result">
                  <div className="cover">
                    {result.cover ? <img src={result.cover} alt="" /> : <BookMarked size={22} />}
                  </div>
                  <div>
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-author">{result.author}</div>
                  </div>
                  <button className="btn btn-tinted btn-sm btn-block" onClick={() => handleAddFromSearch(result)}>
                    <Plus size={13} /> 추가
                  </button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="search-empty">검색 결과가 없습니다. 직접 입력으로 추가해보세요.</div>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="field">
              <label htmlFor="manual-title">책 제목 <small>필수</small></label>
              <input id="manual-title" className="input" placeholder="예: 사피엔스" value={manualForm.title} onChange={(e) => setManualForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="manual-author">저자</label>
              <input id="manual-author" className="input" placeholder="예: 유발 하라리" value={manualForm.author} onChange={(e) => setManualForm(f => ({ ...f, author: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="manual-pages">총 페이지 수</label>
              <input id="manual-pages" className="input" type="number" placeholder="예: 636" value={manualForm.totalPages} onChange={(e) => setManualForm(f => ({ ...f, totalPages: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-lg btn-block" onClick={handleAddManual} disabled={!manualForm.title.trim()}>추가하기</button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        icon={<Trash2 size={22} />}
        danger
        loading={deleting}
        title="이 책을 서재에서 삭제할까요?"
        desc="코칭 대화 기록과 노트는 유지됩니다."
        confirmLabel="삭제"
      />
    </div>
  );
}
