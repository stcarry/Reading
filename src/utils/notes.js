// 기록노트 공용 유틸: 노트 유형 정의, 챕터 정렬, 구조화된 본문 파싱
import {
  KeyRound, FileText, Layers, Quote, CalendarDays, ClipboardList,
  BookOpen, MessageCircle, Briefcase, Sunrise, Lightbulb,
} from 'lucide-react';

export const NOTE_TYPES = [
  { key: 'keyword', label: '키워드 노트', icon: KeyRound, desc: '핵심 키워드 + 자기 언어 요약' },
  { key: 'chapter_summary', label: '챕터 요약', icon: FileText, desc: 'A4 반쪽 이내 요약' },
  { key: 'three_part', label: '3단 구조', icon: Layers, desc: 'What / So What / Now What' },
  { key: 'quote', label: '인상 깊은 구절', icon: Quote, desc: '구절 + 페이지 + 나의 생각' },
  { key: 'action_plan', label: '30일 실천 계획', icon: CalendarDays, desc: '주차별 실천 계획' },
  { key: 'full_summary', label: '전체 요약', icon: ClipboardList, desc: 'A4 2-3장 분량 재정리' },
];

export const CATEGORIES = [
  { key: 'knowledge', label: '지식', icon: BookOpen, desc: '책/강의에서 깨달은 것' },
  { key: 'conversation', label: '대화', icon: MessageCircle, desc: '대화 중 영감 얻은 것' },
  { key: 'work', label: '일', icon: Briefcase, desc: '일 관련 노하우' },
  { key: 'daily', label: '일상', icon: Sunrise, desc: '일상 기록과 감정' },
  { key: 'thought', label: '생각', icon: Lightbulb, desc: '떠오른 아이디어' },
];

export const getNoteType = (key) => NOTE_TYPES.find(t => t.key === key);

const FRONT_MATTER = /(프롤로그|서문|들어가며|들어가는\s*말|머리말|서론|prologue|preface|intro)/i;
const BACK_MATTER = /(에필로그|나가며|나오며|맺음말|맺는\s*말|결론|epilogue|outro|부록|appendix)/i;

/**
 * 챕터 문자열을 정렬 키로 변환합니다.
 * "1장", "제2장 ...", "Part 1 / Chapter 3", "3-2", "p.56" 등에서 숫자 시퀀스를 추출합니다.
 * 반환: [구간(0=앞부분, 1=본문, 2=번호없음, 3=뒷부분), ...숫자들]
 */
export function chapterSortKey(chapter) {
  const text = (chapter || '').trim();
  if (!text) return [2];
  if (FRONT_MATTER.test(text)) return [0];
  if (BACK_MATTER.test(text)) return [3];
  const nums = (text.match(/\d+/g) || []).slice(0, 3).map(Number);
  return nums.length ? [1, ...nums] : [2];
}

function compareKeys(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? -1;
    const y = b[i] ?? -1;
    if (x !== y) return x - y;
  }
  return 0;
}

/**
 * 노트를 챕터 단위로 묶고 챕터 순서대로 정렬합니다.
 * 번호가 없는 챕터는 처음 작성된 시간 순으로 배치됩니다 (작성 순서 = 읽은 순서로 간주).
 */
export function groupNotesByChapter(notes) {
  const groups = new Map();
  for (const note of notes) {
    const name = (note.chapter || '').trim() || '챕터 미지정';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(note);
  }

  const result = [...groups.entries()].map(([name, items]) => {
    const sorted = items.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return {
      name,
      key: chapterSortKey(name === '챕터 미지정' ? '' : name),
      firstAt: new Date(sorted[0]?.createdAt || 0).getTime(),
      notes: sorted,
    };
  });

  result.sort((a, b) => compareKeys(a.key, b.key) || a.firstAt - b.firstAt);
  return result;
}

/** "【라벨】\n내용" 형식으로 저장된 본문을 섹션 배열로 파싱합니다. */
export function parseSections(content) {
  if (!content || !content.includes('【')) return null;
  const regex = /【(.*?)】\n?([\s\S]*?)(?=\n*【|$)/g;
  const sections = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    sections.push({ label: match[1].trim(), text: match[2].trim() });
  }
  return sections.length ? sections : null;
}

export function buildSections(pairs) {
  return pairs
    .filter(([, text]) => text && text.trim())
    .map(([label, text]) => `【${label}】\n${text.trim()}`)
    .join('\n\n');
}

export const slugify = (s) => 'ch-' + encodeURIComponent(s).replace(/%/g, '');
