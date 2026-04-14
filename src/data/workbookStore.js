import { supabase } from '../utils/supabase';

// Helper to notify changes if needed (consistent with store.js)
function notifyDataChange(key) {
  window.dispatchEvent(new CustomEvent('rg-data-change', { detail: { key } }));
}

export async function getWorkbooks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('rg_workbooks')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching workbooks:', error);
    return [];
  }

  return data.map(w => ({
    ...w.data,
    id: w.id,
    bookId: w.book_id
  }));
}

export async function getWorkbook(bookId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('rg_workbooks')
    .select('*')
    .eq('book_id', bookId)
    .single();

  if (error || !data) return null;

  return {
    ...data.data,
    id: data.id,
    bookId: data.book_id
  };
}

export async function createWorkbook(bookId, bookTitle, bookAuthor) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const initialData = {
    bookTitle: bookTitle || '',
    bookAuthor: bookAuthor || '',
    currentStep: 1,
    step1: {
      bookInfo: { genre: '', publisher: '', year: '', pages: '' },
      overview: { summary3Lines: '', coreProblem: '' },
      authorAnalysis: { perspective: '', background: '', historicalContext: '' },
      readingStrategy: { question1: '', question2: '', question3: '', readingGoal: '' },
    },
    step2: {
      chapterNotes: [{ id: '1', chapterName: '', keywords: ['', '', '', '', ''], coreSummary: '' }],
      aiQnA: [{ id: '1', concept: '', aiExplanation: '', myThoughts: '' }],
      quotes: [{ id: '1', text: '', page: '', reflection: '' }],
    },
    step3: {
      fourQuadrant: { knowledge: '', critique: '', authorContext: '', actionPlan: '' },
      realLifeApplication: { work: '', relationships: '', selfDevelopment: '' },
      criticalThinking: { logicalGaps: '', connectionToExisting: '', furtherQuestions: '', comparisonWithOthers: '' },
      thirtyDayProject: { week1: '', week2: '', week3: '', week4: '' },
    },
  };

  const { data, error } = await supabase
    .from('rg_workbooks')
    .insert([{
      user_id: user.id,
      book_id: bookId,
      data: initialData
    }])
    .select()
    .single();

  if (error) throw error;
  notifyDataChange('workbooks');
  return { ...data.data, id: data.id, bookId: data.book_id };
}

export async function updateWorkbook(bookId, updates) {
  const existing = await getWorkbook(bookId);
  if (!existing) return null;

  // Manual deep merge similar to original store
  const newData = deepMerge(existing, updates);
  
  // Clean up ID and bookId from data object before saving
  const { id, bookId: bid, ...dataToSave } = newData;

  const { error } = await supabase
    .from('rg_workbooks')
    .update({ data: dataToSave })
    .eq('book_id', bookId);

  if (error) throw error;
  notifyDataChange('workbooks');
  return newData;
}

export async function addRepeatableItem(bookId, stepKey, arrayKey) {
  const wb = await getWorkbook(bookId);
  if (!wb) return null;

  const newId = Date.now().toString();
  const templates = {
    chapterNotes: { id: newId, chapterName: '', keywords: ['', '', '', '', ''], coreSummary: '' },
    aiQnA: { id: newId, concept: '', aiExplanation: '', myThoughts: '' },
    quotes: { id: newId, text: '', page: '', reflection: '' },
  };

  if (wb[stepKey] && wb[stepKey][arrayKey] && templates[arrayKey]) {
    wb[stepKey][arrayKey].push(templates[arrayKey]);
    return await updateWorkbook(bookId, { [stepKey]: { [arrayKey]: wb[stepKey][arrayKey] } });
  }
  return wb;
}

export async function removeRepeatableItem(bookId, stepKey, arrayKey, itemId) {
  const wb = await getWorkbook(bookId);
  if (!wb) return null;

  if (wb[stepKey] && wb[stepKey][arrayKey]) {
    wb[stepKey][arrayKey] = wb[stepKey][arrayKey].filter(item => item.id !== itemId);
    if (wb[stepKey][arrayKey].length === 0) {
      const newId = Date.now().toString();
      const templates = {
        chapterNotes: { id: newId, chapterName: '', keywords: ['', '', '', '', ''], coreSummary: '' },
        aiQnA: { id: newId, concept: '', aiExplanation: '', myThoughts: '' },
        quotes: { id: newId, text: '', page: '', reflection: '' },
      };
      wb[stepKey][arrayKey].push(templates[arrayKey]);
    }
    return await updateWorkbook(bookId, { [stepKey]: { [arrayKey]: wb[stepKey][arrayKey] } });
  }
  return wb;
}

export function getWorkbookProgress(workbook) {
  if (!workbook) return 0;
  let filled = 0;
  let total = 0;

  const checkValue = (val) => {
    total++;
    if (typeof val === 'string' && val.trim()) filled++;
  };

  const s1 = workbook.step1;
  if (s1) {
    Object.values(s1.bookInfo || {}).forEach(checkValue);
    Object.values(s1.overview || {}).forEach(checkValue);
    Object.values(s1.authorAnalysis || {}).forEach(checkValue);
    Object.values(s1.readingStrategy || {}).forEach(checkValue);
  }

  const s2 = workbook.step2;
  if (s2) {
    (s2.chapterNotes || []).forEach(cn => { checkValue(cn.chapterName); checkValue(cn.coreSummary); });
    (s2.aiQnA || []).forEach(q => { checkValue(q.concept); checkValue(q.myThoughts); });
    (s2.quotes || []).forEach(q => checkValue(q.text));
  }

  const s3 = workbook.step3;
  if (s3) {
    Object.values(s3.fourQuadrant || {}).forEach(checkValue);
    Object.values(s3.realLifeApplication || {}).forEach(checkValue);
    Object.values(s3.criticalThinking || {}).forEach(checkValue);
    Object.values(s3.thirtyDayProject || {}).forEach(checkValue);
  }

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

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
