import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, BookMarked, X, Star, ChevronDown, Trash2, Edit3
} from 'lucide-react';
import { getBooks, addBook, updateBook, deleteBook, searchBooks } from '../data/store';

const STATUS_LABELS = {
  reading: { label: '읽는 중', color: 'amber' },
  done: { label: '완독', color: 'green' },
  want: { label: '읽고 싶은', color: 'violet' },
};

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

  useEffect(() => {
    setBooks(getBooks());
  }, []);

  const refresh = () => setBooks(getBooks());

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchBooks(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery]);

  const handleAddFromSearch = (result) => {
    addBook({
      title: result.title,
      author: result.author,
      cover: result.cover,
      isbn: result.isbn,
      totalPages: result.totalPages,
      description: result.description,
    });
    refresh();
    setShowAddModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddManual = () => {
    if (!manualForm.title.trim()) return;
    addBook({
      title: manualForm.title,
      author: manualForm.author,
      totalPages: parseInt(manualForm.totalPages) || 0,
    });
    refresh();
    setShowAddModal(false);
    setManualForm({ title: '', author: '', totalPages: '' });
    setManualMode(false);
  };

  const handleStatusChange = (bookId, status) => {
    const updates = { status };
    if (status === 'reading' && !getBooks().find(b => b.id === bookId)?.startDate) {
      updates.startDate = new Date().toISOString().split('T')[0];
    }
    if (status === 'done') {
      updates.endDate = new Date().toISOString().split('T')[0];
    }
    updateBook(bookId, updates);
    refresh();
  };

  const handleDelete = (e, bookId) => {
    e.stopPropagation();
    setDeleteConfirmId(bookId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteBook(deleteConfirmId);
      refresh();
      setDeleteConfirmId(null);
    }
  };

  const filteredBooks = activeTab === 'all' ? books : books.filter(b => b.status === activeTab);

  const getKyoboLink = (isbn) => {
    if (!isbn) return null;
    return `https://search.kyobobook.co.kr/search?keyword=${isbn}`;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">내 서재 📚</h1>
            <p className="page-subtitle">읽고 있는 책, 완독한 책, 읽고 싶은 책을 관리하세요</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="add-book-btn"
          >
            <Plus size={16} /> 책 추가
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {[
          { key: 'all', label: `전체 (${books.length})` },
          { key: 'reading', label: `읽는 중 (${books.filter(b => b.status === 'reading').length})` },
          { key: 'done', label: `완독 (${books.filter(b => b.status === 'done').length})` },
          { key: 'want', label: `읽고 싶은 (${books.filter(b => b.status === 'want').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">📖</div>
          <div className="empty-state-title">아직 책이 없어요</div>
          <div className="empty-state-desc">
            위의 "책 추가" 버튼으로 첫 번째 책을 등록해보세요!
          </div>
        </div>
      ) : (
        <div className="book-grid stagger-children">
          {filteredBooks.map(book => {
            const progress = book.totalPages > 0
              ? Math.round((book.currentPage / book.totalPages) * 100)
              : 0;
            const statusInfo = STATUS_LABELS[book.status];

            return (
              <div key={book.id} className="glass-card book-card">
                <div className="book-cover">
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} />
                  ) : (
                    <div className="book-cover-placeholder">
                      <BookMarked size={32} style={{ opacity: 0.3, color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                </div>

                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>

                <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`tag tag-${statusInfo.color}`}>{statusInfo.label}</span>
                  {book.rating > 0 && (
                    <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--amber-400)' }}>
                      <Star size={10} fill="currentColor" /> {book.rating}
                    </span>
                  )}
                </div>

                {book.status === 'reading' && (
                  <div className="book-progress">
                    <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {progress}% ({book.currentPage}/{book.totalPages}p)
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                  <select
                    className="input"
                    value={book.status}
                    onChange={(e) => handleStatusChange(book.id, e.target.value)}
                    style={{ fontSize: 'var(--text-xs)', padding: '4px 8px', flex: 1 }}
                  >
                    <option value="want">읽고 싶은</option>
                    <option value="reading">읽는 중</option>
                    <option value="done">완독</option>
                  </select>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleDelete(e, book.id)}
                    style={{ color: 'var(--rose-400)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                  {book.isbn && (
                    <a
                      href={getKyoboLink(book.isbn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px', minWidth: '32px' }}
                      title="교보문고에서 보기"
                    >
                      <Edit3 size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📚 책 추가하기</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Search Mode Toggle */}
              <div className="tabs mb-4" style={{ width: 'fit-content' }}>
                <button
                  className={`tab ${!manualMode ? 'active' : ''}`}
                  onClick={() => setManualMode(false)}
                >
                  🔍 검색
                </button>
                <button
                  className={`tab ${manualMode ? 'active' : ''}`}
                  onClick={() => setManualMode(true)}
                >
                  ✏️ 직접 입력
                </button>
              </div>

              {!manualMode ? (
                <>
                  <div className="input-wrapper">
                    <Search className="input-icon" size={16} />
                    <input
                      className="input input-with-icon"
                      placeholder="책 제목이나 저자를 검색하세요"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      id="book-search-input"
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full mt-4"
                    onClick={handleSearch}
                    disabled={isSearching}
                    style={{ justifyContent: 'center' }}
                  >
                    {isSearching ? '검색 중...' : '검색'}
                  </button>

                  {/* Search Results */}
                  <div className="flex flex-col gap-3 mt-4" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="glass-card"
                        style={{
                          padding: 'var(--space-3)',
                          display: 'flex',
                          gap: 'var(--space-3)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleAddFromSearch(result)}
                      >
                        <div style={{
                          width: 50, height: 70, borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {result.cover ? (
                            <img src={result.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <BookMarked size={18} style={{ opacity: 0.3 }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{result.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{result.author}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {result.totalPages > 0 && `${result.totalPages}p`}
                            {result.publishedDate && ` · ${result.publishedDate}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleAddFromSearch(result); }}>추가</button>
                          {result.isbn && (
                            <a
                              href={getKyoboLink(result.isbn)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '10px', padding: '2px 4px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              교보 정보
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && searchQuery && !isSearching && (
                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                        검색 결과가 없습니다. 직접 입력으로 추가해보세요.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>
                      책 제목 *
                    </label>
                    <input
                      className="input"
                      placeholder="예: 사피엔스"
                      value={manualForm.title}
                      onChange={(e) => setManualForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>
                      저자
                    </label>
                    <input
                      className="input"
                      placeholder="예: 유발 하라리"
                      value={manualForm.author}
                      onChange={(e) => setManualForm(f => ({ ...f, author: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>
                      총 페이지 수
                    </label>
                    <input
                      className="input"
                      type="number"
                      placeholder="예: 636"
                      value={manualForm.totalPages}
                      onChange={(e) => setManualForm(f => ({ ...f, totalPages: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleAddManual}
                    disabled={!manualForm.title.trim()}
                    style={{ justifyContent: 'center' }}
                  >
                    추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">책 삭제 확인</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirmId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🗑️</div>
              <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                이 책을 서재에서 정말 삭제할까요?<br />
                대화 기록과 노트는 유지됩니다.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button 
                  className="btn btn-secondary w-full" 
                  onClick={() => setDeleteConfirmId(null)}
                  style={{ justifyContent: 'center' }}
                >
                  취소
                </button>
                <button 
                  className="btn btn-primary w-full" 
                  onClick={confirmDelete}
                  style={{ background: 'linear-gradient(135deg, var(--rose-500), var(--rose-600))', boxShadow: 'var(--shadow-glow-rose)', justifyContent: 'center' }}
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
