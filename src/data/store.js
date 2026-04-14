// Local storage based data management for Reading Giant MVP

const STORAGE_KEYS = {
  BOOKS: 'rg_books',
  NOTES: 'rg_notes',
  COACHING_SESSIONS: 'rg_coaching',
  READING_LOG: 'rg_reading_log',
  SETTINGS: 'rg_settings',
};

// === Books ===
export function getBooks() {
  const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
  return data ? JSON.parse(data) : [];
}

export function saveBooks(books) {
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
}

export function addBook(book) {
  const books = getBooks();
  const newBook = {
    id: Date.now().toString(),
    title: book.title || '',
    author: book.author || '',
    cover: book.cover || '',
    isbn: book.isbn || '',
    totalPages: book.totalPages || 0,
    currentPage: 0,
    status: 'want', // 'want' | 'reading' | 'done'
    startDate: null,
    endDate: null,
    rating: 0,
    createdAt: new Date().toISOString(),
    chapters: book.chapters || [],
    description: book.description || '',
  };
  books.push(newBook);
  saveBooks(books);
  return newBook;
}

export function updateBook(id, updates) {
  const books = getBooks();
  const idx = books.findIndex(b => b.id === id);
  if (idx !== -1) {
    books[idx] = { ...books[idx], ...updates };
    saveBooks(books);
    return books[idx];
  }
  return null;
}

export function deleteBook(id) {
  const books = getBooks().filter(b => b.id !== id);
  saveBooks(books);
}

export function getBooksByStatus(status) {
  return getBooks().filter(b => b.status === status);
}

// === Notes ===
export function getNotes() {
  const data = localStorage.getItem(STORAGE_KEYS.NOTES);
  return data ? JSON.parse(data) : [];
}

export function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
}

export function addNote(note) {
  const notes = getNotes();
  const newNote = {
    id: Date.now().toString(),
    bookId: note.bookId || '',
    type: note.type || 'keyword', // 'keyword' | 'chapter_summary' | 'full_summary' | 'three_part'
    chapter: note.chapter || '',
    keywords: note.keywords || [],
    content: note.content || '',
    category: note.category || 'knowledge', // 'knowledge' | 'conversation' | 'work' | 'daily' | 'thought'
    threePart: note.threePart || undefined, // { what, soWhat, nowWhat }
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
}

export function updateNote(id, updates) {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) {
    notes[idx] = { ...notes[idx], ...updates };
    saveNotes(notes);
    return notes[idx];
  }
  return null;
}

export function deleteNote(id) {
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
}

export function getNotesByBook(bookId) {
  return getNotes().filter(n => n.bookId === bookId);
}

// === Coaching Sessions ===
export function getCoachingSessions() {
  const data = localStorage.getItem(STORAGE_KEYS.COACHING_SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function saveCoachingSessions(sessions) {
  localStorage.setItem(STORAGE_KEYS.COACHING_SESSIONS, JSON.stringify(sessions));
}

export function addCoachingSession(session) {
  const sessions = getCoachingSessions();
  const newSession = {
    id: Date.now().toString(),
    bookId: session.bookId,
    step: session.step || 1,
    messages: session.messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.push(newSession);
  saveCoachingSessions(sessions);
  return newSession;
}

export function updateCoachingSession(id, updates) {
  const sessions = getCoachingSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], ...updates, updatedAt: new Date().toISOString() };
    saveCoachingSessions(sessions);
    return sessions[idx];
  }
  return null;
}

// === Reading Log ===
export function getReadingLog() {
  const data = localStorage.getItem(STORAGE_KEYS.READING_LOG);
  return data ? JSON.parse(data) : [];
}

export function addReadingLog(entry) {
  const log = getReadingLog();
  log.push({
    id: Date.now().toString(),
    bookId: entry.bookId,
    date: entry.date || new Date().toISOString().split('T')[0],
    minutesRead: entry.minutesRead || 0,
    pagesRead: entry.pagesRead || 0,
    notes: entry.notes || '',
  });
  localStorage.setItem(STORAGE_KEYS.READING_LOG, JSON.stringify(log));
}

// === Aladin & Google Books API ===
const ALADIN_TTB_KEY = import.meta.env.VITE_ALADIN_TTB_KEY || 'YOUR_ALADIN_TTB_KEY';

export async function searchBooks(query) {
  // 알라딘 API 연동 (국내 도서 품질 향상)
  if (ALADIN_TTB_KEY !== 'YOUR_ALADIN_TTB_KEY') {
    try {
      // Vite proxy(/api/aladin)를 사용하여 CORS 문제를 우회합니다.
      const response = await fetch(
        `/api/aladin?ttbkey=${ALADIN_TTB_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`
      );
      const data = await response.json();
      
      if (data.item && data.item.length > 0) {
        return data.item.map(item => ({
          source: 'aladin',
          id: item.itemId,
          title: item.title || '',
          author: item.author || '',
          cover: item.cover || '',
          isbn: item.isbn13 || item.isbn || '',
          totalPages: item.subInfo?.itemPage || 0,
          description: item.description || '',
          publishedDate: item.pubDate || '',
          publisher: item.publisher || '',
        }));
      }
    } catch (error) {
      console.warn('Aladin search failed, falling back to Google Books:', error);
    }
  }

  // Fallback to Google Books (또는 기본 검색기)
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=ko`
    );
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map(item => ({
      source: 'google',
      id: item.id,
      title: item.volumeInfo.title || '',
      author: (item.volumeInfo.authors || []).join(', '),
      cover: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      isbn: (item.volumeInfo.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || '',
      totalPages: item.volumeInfo.pageCount || 0,
      description: item.volumeInfo.description || '',
      publishedDate: item.volumeInfo.publishedDate || '',
      categories: item.volumeInfo.categories || [],
    }));
  } catch (error) {
    console.error('Book search failed:', error);
    return [];
  }
}

// === Statistics ===
export function getStats() {
  const books = getBooks();
  const notes = getNotes();
  const log = getReadingLog();
  
  const totalBooks = books.length;
  const readingBooks = books.filter(b => b.status === 'reading').length;
  const doneBooks = books.filter(b => b.status === 'done').length;
  const totalNotes = notes.length;
  const totalKeywords = notes.reduce((acc, n) => acc + (n.keywords?.length || 0), 0);
  
  // Reading days this month
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const readingDaysThisMonth = new Set(
    log.filter(l => l.date.startsWith(thisMonth)).map(l => l.date)
  ).size;
  
  // Total reading minutes
  const totalMinutes = log.reduce((acc, l) => acc + (l.minutesRead || 0), 0);
  
  return {
    totalBooks,
    readingBooks,
    doneBooks,
    totalNotes,
    totalKeywords,
    readingDaysThisMonth,
    totalMinutes,
  };
}

// === Sample Data (for demo) ===
export function initSampleData() {
  if (getBooks().length > 0) return;
  
  const sampleBooks = [
    {
      id: '1',
      title: '사피엔스',
      author: '유발 하라리',
      cover: 'https://books.google.com/books/content?id=1EiJDQAAQBAJ&printsec=frontcover&img=1&zoom=1',
      status: 'reading',
      currentPage: 156,
      totalPages: 636,
      startDate: '2026-04-01',
      createdAt: '2026-04-01T00:00:00Z',
      chapters: ['인지 혁명', '농업 혁명', '인류의 통합', '과학 혁명'],
    },
    {
      id: '2',
      title: '거인의 노트',
      author: '김익환',
      cover: '',
      status: 'done',
      currentPage: 280,
      totalPages: 280,
      startDate: '2026-03-15',
      endDate: '2026-03-28',
      rating: 5,
      createdAt: '2026-03-15T00:00:00Z',
      chapters: ['기록의 힘', '요약과 분류', '기록의 원리', '아이디어 뱅크'],
    },
    {
      id: '3',
      title: '원씽 (The ONE Thing)',
      author: '게리 켈러',
      cover: '',
      status: 'want',
      currentPage: 0,
      totalPages: 268,
      createdAt: '2026-04-10T00:00:00Z',
    },
  ];
  
  saveBooks(sampleBooks);
  
  const sampleNotes = [
    {
      id: '1',
      bookId: '2',
      type: 'keyword',
      chapter: '기록의 힘',
      keywords: ['기록', '반복'],
      content: '기록은 매일의 나를 남기는 일. 기록에서 자신이 어떤 가치를 중요히 여기는지 드러남. 성장 메커니즘: 기록 ⇔ 반복 ⇔ 지속',
      category: 'knowledge',
      createdAt: '2026-03-20T00:00:00Z',
    },
    {
      id: '2',
      bookId: '2',
      type: 'keyword',
      chapter: '요약과 분류',
      keywords: ['자기화', '키워드'],
      content: '키워드 위주 요약은 자기화의 과정. 가장 중요한 키워드를 스스로 선택하는 과정 = 고강도 요약. 무엇이던 키워드 2개만 뽑는다!',
      category: 'knowledge',
      createdAt: '2026-03-22T00:00:00Z',
    },
    {
      id: '3',
      bookId: '1',
      type: 'chapter_summary',
      chapter: '인지 혁명',
      keywords: ['허구', '협력'],
      content: '7만 년 전 인지 혁명으로 호모 사피엔스는 허구(신화, 종교, 국가)를 만들어내는 능력을 갖게 되었고, 이를 통해 대규모 협력이 가능해졌다.',
      category: 'knowledge',
      createdAt: '2026-04-05T00:00:00Z',
    },
    {
      id: '4',
      bookId: '1',
      type: 'three_part',
      chapter: '농업 혁명',
      keywords: ['농업혁명', '함정'],
      content: '【본 것 (What)】\n농업혁명은 인류 최대의 사기극이다. 밀이 인간을 가축화했다고 저자는 주장. 식량 잉여 → 인구 폭발 → 더 많은 노동 필요.\n\n【깨달은 것 (So What)】\n"진보"가 반드시 "행복"을 의미하지 않는다는 통찰. 현대 사회도 마찬가지 — 기술 발전이 삶의 질 향상과 동일시되는 것에 의문.\n\n【적용할 것 (Now What)】\n새로운 도구/기술을 도입할 때 "이것이 정말 삶을 나아지게 하는가?" 자문하기. 효율 추구보다 본질적 가치 우선 판단.',
      threePart: {
        what: '농업혁명은 인류 최대의 사기극이다. 밀이 인간을 가축화했다고 저자는 주장. 식량 잉여 → 인구 폭발 → 더 많은 노동 필요.',
        soWhat: '"진보"가 반드시 "행복"을 의미하지 않는다는 통찰. 현대 사회도 마찬가지 — 기술 발전이 삶의 질 향상과 동일시되는 것에 의문.',
        nowWhat: '새로운 도구/기술을 도입할 때 "이것이 정말 삶을 나아지게 하는가?" 자문하기. 효율 추구보다 본질적 가치 우선 판단.',
      },
      category: 'knowledge',
      createdAt: '2026-04-08T00:00:00Z',
    },
  ];
  
  saveNotes(sampleNotes);
  
  const sampleLog = [];
  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 2);
    sampleLog.push({
      id: String(i + 1),
      bookId: i < 5 ? '1' : '2',
      date: date.toISOString().split('T')[0],
      minutesRead: 20 + Math.floor(Math.random() * 40),
      pagesRead: 5 + Math.floor(Math.random() * 15),
    });
  }
  localStorage.setItem(STORAGE_KEYS.READING_LOG, JSON.stringify(sampleLog));
}
