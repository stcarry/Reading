// 도서별 기록노트 PDF 내보내기 & 고화질 인쇄 유틸리티
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getNoteType, parseSections } from './notes';

/**
 * 책별 기록노트를 캔버스 캡처 기반 A4 PDF 파일로 직접 다운로드합니다.
 * (html2pdf 래퍼의 좌표/스크롤 버그를 방지하기 위해 html2canvas + jsPDF를 직접 제어)
 */
export async function downloadBookNotesPdf(book, chapters, bookNotes) {
  if (!bookNotes || bookNotes.length === 0) {
    throw new Error('내보낼 독서 기록이 없습니다.');
  }

  const title = book?.title || '독서기록';
  const author = book?.author || '저자 미상';
  const totalNotes = bookNotes.length;
  const totalChapters = chapters.length;
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 스크롤 위치 저장 후 최상단으로 이동 (html2canvas 스크롤 오프셋 버그 방지)
  const originalScrollY = window.scrollY;
  const originalScrollX = window.scrollX;
  window.scrollTo(0, 0);

  // 1. 화면 전체를 덮는 세련된 로딩 모달
  const overlay = document.createElement('div');
  overlay.id = 'pdf-render-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(10, 10, 16, 0.92)';
  overlay.style.backdropFilter = 'blur(8px)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999999';
  overlay.style.color = '#ffffff';
  overlay.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif";
  overlay.innerHTML = `
    <div style="width:48px; height:48px; border:3px solid rgba(99,102,241,0.25); border-top-color:#818cf8; border-radius:50%; animation:pdf-spin 0.8s linear infinite;"></div>
    <div style="margin-top:20px; font-weight:800; font-size:17px; color:#f5f5f7;">${escapeHtml(title)}</div>
    <div style="margin-top:6px; font-size:13px; color:#a1a1b5;">독서 기록 리포트 PDF를 생성하고 있습니다…</div>
    <div style="margin-top:14px; font-size:11px; color:#818cf8; background:rgba(99,102,241,0.15); padding:4px 12px; border-radius:20px;">
      잠시만 기다려주세요 (약 1~2초 소요)
    </div>
    <style>@keyframes pdf-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(overlay);

  // 2. 렌더링 컨테이너를 화면 맨 위에 확실히 보이도록 배치 (가려짐으로 인한 빈 캔버스 방지)
  // overlay 바로 아래가 아니라, 화면 최상단에 실제 DOM 요소로 마운트하여 100% 렌더링 보장
  const container = document.createElement('div');
  container.className = 'pdf-render-target';
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px'; // A4 폭 (96DPI 기준 210mm)
  container.style.minHeight = '1123px'; // A4 높이 (297mm)
  container.style.background = '#ffffff';
  container.style.color = '#1f2937';
  container.style.padding = '44px 48px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif";
  container.style.lineHeight = '1.65';
  container.style.fontSize = '13px';
  container.style.zIndex = '9999990';
  container.style.opacity = '0.01'; // 눈에는 안 보이지만 캔버스 렌더러는 감지할 수 있도록 유지
  container.style.pointerEvents = 'none';

  // 목차 리스트 HTML
  const tocHtml = chapters.map((ch, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:baseline; padding:5px 0; border-bottom:1px dotted #e5e7eb; font-size:12px;">
      <span style="font-weight:600; color:#374151;">${String(idx + 1).padStart(2, '0')}. ${escapeHtml(ch.name)}</span>
      <span style="color:#6b7280; font-size:11px; font-family:monospace;">기록 ${ch.notes.length}건</span>
    </div>
  `).join('');

  // 챕터별 기록 HTML
  const chaptersHtml = chapters.map((ch, idx) => {
    const chapterKws = [...new Set(ch.notes.flatMap(n => n.keywords || []))];
    const notesHtml = ch.notes.map(note => {
      const typeInfo = getNoteType(note.type);
      const typeLabel = typeInfo ? typeInfo.label : note.type;
      const noteDate = new Date(note.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      const kwsHtml = (note.keywords || []).map(k => `<span style="display:inline-block; background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:12px; font-size:11px; margin-right:4px; font-weight:600;">#${escapeHtml(k)}</span>`).join('');

      let bodyHtml = '';
      if (note.type === 'three_part') {
        const tp = note.threePart || {};
        const sections = parseSections(note.content) || [];
        const get = (l) => sections.find(s => s.label.startsWith(l))?.text || '';
        const whatText = tp.what || get('본 것');
        const soWhatText = tp.soWhat || get('깨달은 것');
        const nowWhatText = tp.nowWhat || get('적용할 것');

        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            ${whatText ? `
              <div style="padding:9px 13px; border-left:3px solid #0d9488; background:#f0fdfa; border-radius:0 6px 6px 0;">
                <div style="font-size:11px; font-weight:700; color:#0f766e; margin-bottom:3px;">📝 본 것 (What)</div>
                <div style="font-size:12.5px; color:#134e4a; white-space:pre-wrap; line-height:1.7;">${escapeHtml(whatText)}</div>
              </div>
            ` : ''}
            ${soWhatText ? `
              <div style="padding:9px 13px; border-left:3px solid #d97706; background:#fffbeb; border-radius:0 6px 6px 0;">
                <div style="font-size:11px; font-weight:700; color:#b45309; margin-bottom:3px;">💡 깨달은 것 (So What)</div>
                <div style="font-size:12.5px; color:#78350f; white-space:pre-wrap; line-height:1.7;">${escapeHtml(soWhatText)}</div>
              </div>
            ` : ''}
            ${nowWhatText ? `
              <div style="padding:9px 13px; border-left:3px solid #16a34a; background:#f0fdf4; border-radius:0 6px 6px 0;">
                <div style="font-size:11px; font-weight:700; color:#15803d; margin-bottom:3px;">🎯 적용할 것 (Now What)</div>
                <div style="font-size:12.5px; color:#14532d; white-space:pre-wrap; line-height:1.7;">${escapeHtml(nowWhatText)}</div>
              </div>
            ` : ''}
          </div>
        `;
      } else if (note.type === 'quote') {
        const sections = parseSections(note.content) || [];
        const get = (l) => sections.find(s => s.label === l)?.text || '';
        const quote = get('구절') || note.content;
        const page = get('페이지');
        const reflection = get('나의 생각');

        bodyHtml = `
          <div style="margin-top:8px;">
            <blockquote style="margin:0; padding:10px 14px; border-left:3px solid #e11d48; background:#fff1f2; border-radius:0 6px 6px 0; font-style:italic; font-size:13px; color:#9f1239; line-height:1.75;">
              "${escapeHtml(quote)}"
              ${page ? `<span style="display:block; font-size:11px; color:#be123c; margin-top:4px; font-style:normal; font-family:monospace;">— ${escapeHtml(page)}</span>` : ''}
            </blockquote>
            ${reflection ? `<div style="margin-top:6px; font-size:12px; color:#4b5563; padding-left:14px; line-height:1.65; white-space:pre-wrap;">${escapeHtml(reflection)}</div>` : ''}
          </div>
        `;
      } else {
        const sections = parseSections(note.content);
        if (sections) {
          bodyHtml = `
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
              ${sections.map(s => `
                <div style="padding:7px 11px; border-left:2px solid #6366f1; background:#f5f3ff; border-radius:0 4px 4px 0;">
                  <div style="font-size:11px; font-weight:700; color:#4f46e5;">${escapeHtml(s.label)}</div>
                  <div style="font-size:12.5px; color:#312e81; white-space:pre-wrap; line-height:1.65;">${escapeHtml(s.text)}</div>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          bodyHtml = `<div style="margin-top:8px; font-size:12.5px; color:#374151; white-space:pre-wrap; line-height:1.7;">${escapeHtml(note.content)}</div>`;
        }
      }

      return `
        <div class="pdf-note-card" style="margin-bottom:16px; padding:14px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:700; color:#4f46e5; background:#e0e7ff; padding:2px 8px; border-radius:12px;">${typeLabel}</span>
            <span style="font-size:11px; color:#9ca3af; font-family:monospace;">${noteDate}</span>
          </div>
          ${kwsHtml ? `<div style="margin-bottom:6px;">${kwsHtml}</div>` : ''}
          ${bodyHtml}
        </div>
      `;
    }).join('');

    return `
      <section class="pdf-chapter-section" style="margin-bottom:28px;">
        <div style="display:flex; align-items:baseline; gap:8px; padding-bottom:6px; border-bottom:2px solid #1f2937; margin-bottom:14px;">
          <span style="font-family:monospace; font-weight:800; font-size:15px; color:#4f46e5;">${String(idx + 1).padStart(2, '0')}</span>
          <h3 style="margin:0; font-size:16px; font-weight:800; color:#111827;">${escapeHtml(ch.name)}</h3>
          ${chapterKws.length > 0 ? `<span style="font-size:11px; color:#6366f1; margin-left:auto; font-weight:500;">${chapterKws.map(k => '#' + escapeHtml(k)).join(' ')}</span>` : ''}
        </div>
        ${notesHtml}
      </section>
    `;
  }).join('');

  container.innerHTML = `
    <!-- 표지 및 헤더 영역 -->
    <div style="border-bottom:3px solid #111827; padding-bottom:20px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span style="display:inline-block; font-size:11px; font-weight:800; letter-spacing:0.12em; color:#4f46e5; text-transform:uppercase; margin-bottom:4px;">
            READING GIANT · 독서 기록 노트
          </span>
          <h1 style="margin:0 0 6px 0; font-size:24px; font-weight:900; color:#111827; letter-spacing:-0.03em;">
            ${escapeHtml(title)}
          </h1>
          <div style="font-size:13px; color:#4b5563; font-weight:600;">
            ${escapeHtml(author)}
          </div>
        </div>
        <div style="text-align:right; font-size:11px; color:#6b7280; font-family:monospace;">
          <div>출력일: ${today}</div>
          <div style="margin-top:2px;">챕터 ${totalChapters}개 · 총 기록 ${totalNotes}건</div>
        </div>
      </div>
    </div>

    <!-- 목차 요약 박스 -->
    ${chapters.length > 1 ? `
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px 18px; margin-bottom:24px;">
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:#4f46e5; margin-bottom:8px;">
          📚 챕터 목차 (Index)
        </div>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px 20px;">
          ${tocHtml}
        </div>
      </div>
    ` : ''}

    <!-- 본문 내용 -->
    <div class="pdf-body">
      ${chaptersHtml}
    </div>

    <!-- 푸터 워터마크 -->
    <div style="margin-top:30px; padding-top:12px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#9ca3af;">
      <span>리딩 자이언트 (Reading Giant) — 독서와 기록으로 지식을 온전히 내 것으로 만듭니다.</span>
      <span>${escapeHtml(title)}</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // 렌더링이 브라우저 레이아웃에 완전히 계산될 수 있도록 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 캡처 시 opacity를 1로 순간 전환
    container.style.opacity = '1';

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('문서 캔버스 생성에 실패했습니다.');
    }

    // jsPDF를 통한 A4 다중 페이지 분할 렌더링
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = 210; // A4 가로 (mm)
    const pageHeight = 297; // A4 세로 (mm)
    
    // 캔버스 크기를 A4 기준 mm 높이로 환산
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // 첫 페이지 추가
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 내용이 1페이지를 초과할 경우 다음 페이지 계속 추가
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanFileName = sanitizeFileName(`${title}_독서기록노트.pdf`);
    pdf.save(cleanFileName);
  } catch (err) {
    console.error('Direct PDF export error:', err);
    // 실패 시 사용자에게 브라우저 인쇄(PDF 저장)로 우회할 수 있도록 안내
    const confirmPrint = window.confirm(
      '직접 PDF 생성 중 문제가 발생했습니다.\n브라우저의 고화질 [PDF로 저장] 창을 열어 다운로드하시겠습니까?'
    );
    if (confirmPrint) {
      printBookNotes(title);
    }
  } finally {
    // 상태 복원 및 임시 요소 제거
    window.scrollTo(originalScrollX, originalScrollY);
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * 브라우저 인쇄 다이얼로그(고화질 벡터 PDF 저장 지원)를 호출합니다.
 * (가장 안정적이고 글자가 깨지지 않는 웹 표준 PDF 저장 방식)
 */
export function printBookNotes(bookTitle) {
  const originalTitle = document.title;
  const printTitle = sanitizeFileName(`${bookTitle || '독서기록'}_독서기록노트`);
  document.title = printTitle;

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}
