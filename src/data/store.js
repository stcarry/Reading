// Local storage & Supabase based data management for Reading Giant MVP
import { supabase } from '../utils/supabase';

const STORAGE_KEYS = {
  BOOKS: 'rg_books',
  NOTES: 'rg_notes',
  COACHING_SESSIONS: 'rg_coaching',
  READING_LOG: 'rg_reading_log',
  SETTINGS: 'rg_settings',
  USER: 'rg_user',
};

// Helper to notify other parts of the app about data changes
function notifyDataChange(key) {
  // Dispatch a custom event for the current window
  window.dispatchEvent(new CustomEvent('rg-data-change', { detail: { key } }));
  // Storage event is automatically dispatched for other windows/tabs by the browser
}

// === Books (Supabase Integrated) ===
export async function getBooks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('rg_books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }
  
  // Map Supabase columns to frontend property names
  return data.map(b => ({
    ...b,
    cover: b.cover_url,
    currentPage: b.current_page,
    totalPages: b.total_pages,
    startDate: b.start_date,
    endDate: b.end_date
  }));
}

export async function addBook(book) {
  // 1. 세션 확인
  let { data: { session } } = await supabase.auth.getSession();
  let user = session?.user;
  
  // 2. 세션이 없다면 getUser로 직접 확인 (네트워크 통신 시도)
  if (!user) {
    console.log('Session not in memory, trying to fetch user from server...');
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    user = fetchedUser;
  }
  
  if (!user) {
    console.error('Final auth check failed. No user found.');
    throw new Error('로그인 정보가 유효하지 않습니다. [로그아웃] 후 다시 [로그인] 해주세요.');
  }

  console.log('Book added for:', user.email);

  const { data, error } = await supabase
    .from('rg_books')
    .insert([{
      user_id: user.id,
      title: book.title || '제목 없음',
      author: book.author || '저자 미상',
      cover_url: book.cover || '',
      isbn: book.isbn || '',
      total_pages: parseInt(book.totalPages) || 0,
      current_page: 0,
      status: 'want',
      chapters: book.chapters || [],
      description: book.description || '',
    }])
    .select();

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  
  notifyDataChange(STORAGE_KEYS.BOOKS);
  return data[0];
}

export async function updateBook(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const mappedUpdates = { ...updates };
  if (updates.cover !== undefined) {
    mappedUpdates.cover_url = updates.cover;
    delete mappedUpdates.cover;
  }
  if (updates.totalPages !== undefined) {
    mappedUpdates.total_pages = updates.totalPages;
    delete mappedUpdates.totalPages;
  }
  if (updates.currentPage !== undefined) {
    mappedUpdates.current_page = updates.currentPage;
    delete mappedUpdates.currentPage;
  }

  const { data, error } = await supabase
    .from('rg_books')
    .update(mappedUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.BOOKS);
  return data[0];
}

export async function deleteBook(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('rg_books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.BOOKS);
}

export function getBooksByStatus(books, status) {
  return books.filter(b => b.status === status);
}

// === Notes (Supabase Integrated) ===
export async function getNotes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('rg_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
  
  return data;
}

export async function addNote(note) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('rg_notes')
    .insert([{
      user_id: user.id,
      book_id: note.bookId,
      type: note.type || 'keyword',
      chapter: note.chapter || '',
      keywords: note.keywords || [],
      content: note.content || '',
      category: note.category || 'knowledge',
      three_part: note.threePart,
    }])
    .select();

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.NOTES);
  return data[0];
}

export async function deleteNote(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('rg_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.NOTES);
}

export function getNotesByBook(notes, bookId) {
  return notes.filter(n => n.bookId === bookId);
}

// === Coaching Sessions (Supabase Integrated) ===
export async function getCoachingSessions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('rg_coaching_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching coaching sessions:', error);
    return [];
  }
  
  return data.map(s => ({ ...s, bookId: s.book_id }));
}

export async function addCoachingSession(session) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('rg_coaching_sessions')
    .insert([{
      user_id: user.id,
      book_id: session.bookId,
      step: String(session.step || 1),
      messages: session.messages || []
    }])
    .select();

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.COACHING_SESSIONS);
  return { ...data[0], bookId: data[0].book_id };
}

export async function updateCoachingSession(id, updates) {
  const { error } = await supabase
    .from('rg_coaching_sessions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.COACHING_SESSIONS);
}

// === Stats & Logs (Supabase Integrated) ===
export async function getReadingLog() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('rg_reading_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('reading_date', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
  
  return data.map(l => ({ 
    ...l, 
    date: l.reading_date,
    minutesRead: l.minutes_read,
    pagesRead: l.pages_read
  }));
}

export async function addReadingLog(entry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('rg_reading_logs')
    .insert([{
      user_id: user.id,
      book_id: entry.bookId,
      reading_date: entry.date || new Date().toISOString().split('T')[0],
      minutes_read: entry.minutesRead || 0,
      pages_read: entry.pagesRead || 0,
      notes: entry.notes || '',
    }])
    .select();

  if (error) throw error;
  notifyDataChange(STORAGE_KEYS.READING_LOG);
  return data[0];
}

export async function getStats() {
  const [books, notes, logs] = await Promise.all([
    getBooks(),
    getNotes(),
    getReadingLog()
  ]);

  const readingBooks = books.filter(b => b.status === 'reading').length;
  const doneBooks = books.filter(b => b.status === 'done').length;
  const totalNotes = notes.length;
  const totalKeywords = notes.reduce((acc, curr) => acc + (curr.keywords?.length || 0), 0);
  
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const readingDaysThisMonth = new Set(logs.filter(l => l.date.startsWith(monthStr)).map(l => l.date)).size;

  return {
    totalBooks: books.length,
    readingBooks,
    doneBooks,
    totalNotes,
    totalKeywords,
    readingDaysThisMonth,
    totalMinutes: logs.reduce((acc, curr) => acc + (curr.minutes_read || 0), 0),
    totalPages: logs.reduce((acc, curr) => acc + (curr.pages_read || 0), 0),
  };
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


// === Sample Data (Legacy) ===

// === Sample Data (for demo) ===
export function initSampleData() {
  if (localStorage.getItem(STORAGE_KEYS.BOOKS)) return;
  
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
  
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(sampleBooks));
  
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
  
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(sampleNotes));
  
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

// === User / Auth (Supabase Integrated) ===
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });
  if (error) throw error;
  return data.user;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Helper to keep track of auth state changes globally
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null);
  });
}
