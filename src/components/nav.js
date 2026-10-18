import {
  LayoutDashboard, Library, Sparkles, NotebookPen, BarChart3, BookMarked, ClipboardList,
} from 'lucide-react';

/** 앱 전체 내비게이션 정의 — Sidebar(데스크톱)와 TabBar(모바일)가 공유 */
export const NAV = [
  { section: '독서' },
  { path: '/', icon: LayoutDashboard, label: '대시보드', id: 'nav-dashboard', tab: true },
  { path: '/library', icon: Library, label: '내 서재', id: 'nav-library', tab: true },
  { path: '/coaching', icon: Sparkles, label: 'AI 독서 코칭', short: '코칭', id: 'nav-coaching', tab: true },
  { path: '/notes', icon: NotebookPen, label: '기록 노트', short: '노트', id: 'nav-notes', tab: true },
  { section: '더 보기' },
  { path: '/workbook', icon: ClipboardList, label: '책 해부 워크북', short: '워크북', id: 'nav-workbook' },
  { path: '/stats', icon: BarChart3, label: '성장 통계', short: '통계', id: 'nav-stats' },
  { path: '/guide', icon: BookMarked, label: '독서법 가이드', short: '가이드', id: 'nav-guide' },
];

export const NAV_ITEMS = NAV.filter(n => n.path);
