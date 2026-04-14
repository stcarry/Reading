// Workbook data management - 책 해부 워크북 (도서별 1개)

const STORAGE_KEY = 'rg_workbooks';

function getAll() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAll(workbooks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workbooks));
}

// Get workbook for a specific book
export function getWorkbook(bookId) {
  return getAll().find(w => w.bookId === bookId) || null;
}

// Get all workbooks
export function getWorkbooks() {
  return getAll();
}

// Create or get existing workbook for a book
export function createWorkbook(bookId, bookTitle, bookAuthor) {
  const existing = getWorkbook(bookId);
  if (existing) return existing;

  const workbook = {
    id: Date.now().toString(),
    bookId,
    bookTitle: bookTitle || '',
    bookAuthor: bookAuthor || '',
    currentStep: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // STEP 1: Before Reading
    step1: {
      // 도서 기본 정보
      bookInfo: {
        genre: '',
        publisher: '',
        year: '',
        pages: '',
      },
      // 책 개요 & AI 요약
      overview: {
        summary3Lines: '',
        coreProblem: '',
      },
      // 저자 및 배경 분석
      authorAnalysis: {
        perspective: '',
        background: '',
        historicalContext: '',
      },
      // 독서 전략
      readingStrategy: {
        question1: '',
        question2: '',
        question3: '',
        readingGoal: '',
      },
    },

    // STEP 2: While Reading
    step2: {
      // 챕터별 키워드 요약노트 (배열 — 반복 추가 가능)
      chapterNotes: [
        {
          id: '1',
          chapterName: '',
          keywords: ['', '', '', '', ''],
          coreSummary: '',
        },
      ],
      // AI 심화 질의응답
      aiQnA: [
        {
          id: '1',
          concept: '',
          aiExplanation: '',
          myThoughts: '',
        },
      ],
      // 문장 수집
      quotes: [
        {
          id: '1',
          text: '',
          page: '',
          reflection: '',
        },
      ],
    },

    // STEP 3: After Reading
    step3: {
      // 4분할 압축 기록
      fourQuadrant: {
        knowledge: '',    // 지식 (요약)
        critique: '',     // 비판 (동의/반박)
        authorContext: '', // 저자 (맥락)
        actionPlan: '',   // 액션 플랜 (3가지 행동)
      },
      // 실생활 적용
      realLifeApplication: {
        work: '',
        relationships: '',
        selfDevelopment: '',
      },
      // 비판적 사고 & 확장
      criticalThinking: {
        logicalGaps: '',
        connectionToExisting: '',
        furtherQuestions: '',
        comparisonWithOthers: '',
      },
      // 30일 프로젝트
      thirtyDayProject: {
        week1: '',
        week2: '',
        week3: '',
        week4: '',
      },
    },
  };

  const all = getAll();
  all.push(workbook);
  saveAll(all);
  return workbook;
}

// Update workbook (auto-save)
export function updateWorkbook(bookId, updates) {
  const all = getAll();
  const idx = all.findIndex(w => w.bookId === bookId);
  if (idx === -1) return null;

  // Deep merge updates
  const wb = all[idx];
  if (updates.step1) {
    wb.step1 = deepMerge(wb.step1, updates.step1);
  }
  if (updates.step2) {
    wb.step2 = deepMerge(wb.step2, updates.step2);
  }
  if (updates.step3) {
    wb.step3 = deepMerge(wb.step3, updates.step3);
  }
  if (updates.currentStep !== undefined) {
    wb.currentStep = updates.currentStep;
  }
  wb.updatedAt = new Date().toISOString();

  all[idx] = wb;
  saveAll(all);
  return wb;
}

// Delete workbook
export function deleteWorkbook(bookId) {
  const all = getAll().filter(w => w.bookId !== bookId);
  saveAll(all);
}

// Add repeatable item (chapter note, AI Q&A, quote)
export function addRepeatableItem(bookId, stepKey, arrayKey) {
  const all = getAll();
  const idx = all.findIndex(w => w.bookId === bookId);
  if (idx === -1) return null;

  const wb = all[idx];
  const newId = Date.now().toString();

  const templates = {
    chapterNotes: { id: newId, chapterName: '', keywords: ['', '', '', '', ''], coreSummary: '' },
    aiQnA: { id: newId, concept: '', aiExplanation: '', myThoughts: '' },
    quotes: { id: newId, text: '', page: '', reflection: '' },
  };

  if (wb[stepKey] && wb[stepKey][arrayKey] && templates[arrayKey]) {
    wb[stepKey][arrayKey].push(templates[arrayKey]);
    wb.updatedAt = new Date().toISOString();
    all[idx] = wb;
    saveAll(all);
  }
  return wb;
}

// Remove repeatable item
export function removeRepeatableItem(bookId, stepKey, arrayKey, itemId) {
  const all = getAll();
  const idx = all.findIndex(w => w.bookId === bookId);
  if (idx === -1) return null;

  const wb = all[idx];
  if (wb[stepKey] && wb[stepKey][arrayKey]) {
    wb[stepKey][arrayKey] = wb[stepKey][arrayKey].filter(item => item.id !== itemId);
    if (wb[stepKey][arrayKey].length === 0) {
      // Always keep at least one empty item
      const newId = Date.now().toString();
      const templates = {
        chapterNotes: { id: newId, chapterName: '', keywords: ['', '', '', '', ''], coreSummary: '' },
        aiQnA: { id: newId, concept: '', aiExplanation: '', myThoughts: '' },
        quotes: { id: newId, text: '', page: '', reflection: '' },
      };
      wb[stepKey][arrayKey].push(templates[arrayKey]);
    }
    wb.updatedAt = new Date().toISOString();
    all[idx] = wb;
    saveAll(all);
  }
  return wb;
}

// Calculate workbook completion percentage
export function getWorkbookProgress(workbook) {
  if (!workbook) return 0;
  let filled = 0;
  let total = 0;

  const checkValue = (val) => {
    total++;
    if (typeof val === 'string' && val.trim()) filled++;
  };

  // Step 1
  const s1 = workbook.step1;
  Object.values(s1.bookInfo).forEach(checkValue);
  Object.values(s1.overview).forEach(checkValue);
  Object.values(s1.authorAnalysis).forEach(checkValue);
  Object.values(s1.readingStrategy).forEach(checkValue);

  // Step 2
  const s2 = workbook.step2;
  s2.chapterNotes.forEach(cn => {
    checkValue(cn.chapterName);
    checkValue(cn.coreSummary);
  });
  s2.aiQnA.forEach(q => {
    checkValue(q.concept);
    checkValue(q.myThoughts);
  });
  s2.quotes.forEach(q => checkValue(q.text));

  // Step 3
  const s3 = workbook.step3;
  Object.values(s3.fourQuadrant).forEach(checkValue);
  Object.values(s3.realLifeApplication).forEach(checkValue);
  Object.values(s3.criticalThinking).forEach(checkValue);
  Object.values(s3.thirtyDayProject).forEach(checkValue);

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
