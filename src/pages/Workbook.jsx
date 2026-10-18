import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, ChevronDown, Plus, Trash2, ArrowRight, ArrowLeft, BookMarked,
  Search, Brain, Lightbulb, Info, ClipboardList, FileText, User, Target, KeyRound,
  MessageCircle, Quote, Layers, Briefcase, Users, Sprout, Scale, Link2, HelpCircle,
  CalendarDays, Check, Loader2, AlertCircle,
} from 'lucide-react';
import { getBooks } from '../data/store';
import {
  getWorkbook, createWorkbook, updateWorkbook,
  addRepeatableItem, removeRepeatableItem, getWorkbooks,
} from '../data/workbookStore';
import { EmptyState } from '../components/ui';

const STEPS = [
  { num: 1, title: 'Before Reading', subtitle: '읽기 전 — 독서 설계', icon: Search },
  { num: 2, title: 'While Reading', subtitle: '읽는 중 — 이해 심화 & 기록', icon: BookOpen },
  { num: 3, title: 'After Reading', subtitle: '읽은 후 — 지식 내재화', icon: Brain },
];

/* 섹션 (disclosure) — Workbook 함수 바깥에 두어 입력 포커스 유지 */
const Section = ({ id, icon: Icon, title, children, hint, expandedSections, toggleSection }) => {
  const isExpanded = expandedSections[id] !== false; // 기본 열림
  return (
    <div className={`disclosure ${isExpanded ? 'open' : ''}`}>
      <button className="disclosure-head" onClick={() => toggleSection(id)} aria-expanded={isExpanded}>
        <div className="list-icon">{Icon && <Icon size={15} />}</div>
        <div className="disclosure-title">{title}</div>
        <ChevronDown size={18} className="disclosure-chevron" />
      </button>
      {isExpanded && (
        <div className="disclosure-body">
          {hint && <div className="hint"><Lightbulb size={14} /><span>{hint}</span></div>}
          {children}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, multiline, rows }) => (
  <div className="field">
    <label>{label}</label>
    {multiline ? (
      <textarea className="textarea" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ minHeight: rows ? rows * 28 : 80 }} />
    ) : (
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    )}
  </div>
);

export default function Workbook() {
  const [books, setBooks] = useState([]);
  const [workbooks, setWorkbooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSections, setExpandedSections] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      const fetchedBooks = await getBooks();
      setBooks(fetchedBooks);
      const allWorkbooks = await getWorkbooks();
      setWorkbooks(allWorkbooks);
      if (allWorkbooks.length > 0) setSelectedBookId(allWorkbooks[0].bookId);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadWorkbook = async () => {
      if (!selectedBookId) { setWorkbook(null); return; }
      const wb = await getWorkbook(selectedBookId);
      if (wb) { setWorkbook(wb); setCurrentStep(wb.currentStep || 1); }
      else setWorkbook(null);
    };
    loadWorkbook();
  }, [selectedBookId]);

  const autoSave = useCallback((bookId, updates) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const updated = await updateWorkbook(bookId, updates);
        if (updated) { setSaveStatus('saved'); setTimeout(() => setSaveStatus(''), 2000); }
      } catch {
        setSaveStatus('error');
      }
    }, 1000);
  }, []);

  const handleStartWorkbook = async () => {
    if (!selectedBookId) return;
    const book = books.find(b => b.id === selectedBookId);
    if (!book) return;
    try {
      const wb = await createWorkbook(selectedBookId, book.title, book.author);
      setWorkbook(wb); setCurrentStep(1); setExpandedSections({ bookInfo: true });
    } catch (err) {
      alert('워크북 생성 실패: ' + err.message);
    }
  };

  const handleFieldChange = (stepKey, sectionKey, fieldKey, value) => {
    if (!workbook) return;
    const newWorkbook = { ...workbook };
    if (!newWorkbook[stepKey]) newWorkbook[stepKey] = {};
    if (!newWorkbook[stepKey][sectionKey]) newWorkbook[stepKey][sectionKey] = {};
    newWorkbook[stepKey][sectionKey][fieldKey] = value;
    setWorkbook(newWorkbook);
    autoSave(workbook.bookId, { [stepKey]: { [sectionKey]: { [fieldKey]: value } } });
  };

  const handleRepeatFieldChange = (stepKey, arrayKey, itemId, fieldKey, value) => {
    if (!workbook) return;
    const arr = workbook[stepKey][arrayKey].map(item => item.id === itemId ? { ...item, [fieldKey]: value } : item);
    setWorkbook({ ...workbook, [stepKey]: { ...workbook[stepKey], [arrayKey]: arr } });
    autoSave(workbook.bookId, { [stepKey]: { [arrayKey]: arr } });
  };

  const handleKeywordChange = (itemId, keyIdx, value) => {
    if (!workbook) return;
    const arr = workbook.step2.chapterNotes.map(item => {
      if (item.id !== itemId) return item;
      const kw = [...item.keywords]; kw[keyIdx] = value;
      return { ...item, keywords: kw };
    });
    setWorkbook({ ...workbook, step2: { ...workbook.step2, chapterNotes: arr } });
    autoSave(workbook.bookId, { step2: { chapterNotes: arr } });
  };

  const handleAddItem = async (stepKey, arrayKey) => {
    if (!workbook) return;
    const updated = await addRepeatableItem(workbook.bookId, stepKey, arrayKey);
    if (updated) setWorkbook({ ...updated });
  };

  const handleRemoveItem = async (stepKey, arrayKey, itemId) => {
    if (!workbook) return;
    const updated = await removeRepeatableItem(workbook.bookId, stepKey, arrayKey, itemId);
    if (updated) setWorkbook({ ...updated });
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const goToStep = (step) => {
    setCurrentStep(step);
    if (workbook) updateWorkbook(workbook.bookId, { currentStep: step });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionProps = { expandedSections, toggleSection };
  const activeStep = STEPS[currentStep - 1];

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">책 해부 워크북</h1>
          <p className="page-subtitle">책 한 권을 체계적으로 해부하고, 읽기 전·중·후 전 과정을 기록하세요</p>
        </div>
      </div>

      <div className="wb-picker">
        <BookOpen size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <select className="select" value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} aria-label="도서 선택">
          <option value="">도서를 선택하세요</option>
          {books.map(b => {
            const hasWorkbook = workbooks.some(w => w.bookId === b.id);
            return <option key={b.id} value={b.id}>{b.title} — {b.author}{hasWorkbook ? ' (작성 중)' : ''}</option>;
          })}
        </select>
        {selectedBookId && !workbook && (
          <button className="btn btn-primary" onClick={handleStartWorkbook}><Plus size={16} /> 워크북 시작</button>
        )}
        {saveStatus === 'saving' && <span className="wb-save"><Loader2 size={13} className="spinner" /> 저장 중</span>}
        {saveStatus === 'saved' && <span className="wb-save ok"><Check size={13} /> 저장됨</span>}
        {saveStatus === 'error' && <span className="wb-save err"><AlertCircle size={13} /> 저장 실패</span>}
      </div>

      {!workbook && (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="워크북을 시작하세요"
          desc={<>위에서 도서를 선택하고 ‘워크북 시작’을 누르면 체계적인 독서 해부가 시작됩니다.<br />입력 내용은 자동으로 저장됩니다.</>}
        />
      )}

      {workbook && (
        <>
          <div className="co-book-bar">
            <div className="cover"><BookMarked size={14} /></div>
            <div className="flex-1">
              <div className="co-book-title truncate">{workbook.bookTitle}</div>
              <div className="co-book-author truncate">{workbook.bookAuthor}</div>
            </div>
          </div>

          <div className="steps cols-3" role="tablist" aria-label="워크북 단계">
            {STEPS.map(step => {
              const isActive = currentStep === step.num;
              return (
                <button key={step.num} role="tab" aria-selected={isActive} className={`step ${isActive ? 'active' : ''} ${currentStep > step.num ? 'done' : ''}`} onClick={() => goToStep(step.num)}>
                  <div className="step-top"><span className="step-num">{step.num}</span><span className="step-title">{step.title}</span></div>
                  <span className="step-sub">{step.subtitle}</span>
                </button>
              );
            })}
          </div>

          <h2 className="wb-step-title"><activeStep.icon size={20} className="c-accent" /> {activeStep.title} <small>{activeStep.subtitle}</small></h2>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="animate-in">
              <Section id="bookInfo" icon={FileText} title="도서 기본 정보" {...sectionProps}>
                <div className="field-row">
                  <Field label="분야/장르" value={workbook.step1.bookInfo.genre} onChange={v => handleFieldChange('step1', 'bookInfo', 'genre', v)} placeholder="예: 인문학, 과학, 경영" />
                  <Field label="출판사" value={workbook.step1.bookInfo.publisher} onChange={v => handleFieldChange('step1', 'bookInfo', 'publisher', v)} placeholder="출판사명" />
                  <Field label="출판 연도" value={workbook.step1.bookInfo.year} onChange={v => handleFieldChange('step1', 'bookInfo', 'year', v)} placeholder="예: 2015" />
                  <Field label="페이지 수" value={workbook.step1.bookInfo.pages} onChange={v => handleFieldChange('step1', 'bookInfo', 'pages', v)} placeholder="예: 636" />
                </div>
              </Section>

              <Section id="overview" icon={ClipboardList} title="책 개요 & AI 요약" {...sectionProps} hint='AI 프롬프트 예시: "이 책의 핵심 주제와 주요 주장을 3줄로 요약해줘"'>
                <Field label="핵심 주제 & 주요 주장 (3줄 요약)" multiline rows={4} value={workbook.step1.overview.summary3Lines} onChange={v => handleFieldChange('step1', 'overview', 'summary3Lines', v)} placeholder="이 책의 핵심 주제를 3줄로 요약하세요" />
                <Field label="문제의식 — 저자가 답하려는 핵심 질문" multiline rows={3} value={workbook.step1.overview.coreProblem} onChange={v => handleFieldChange('step1', 'overview', 'coreProblem', v)} placeholder="저자가 이 책을 통해 답하려는 핵심 질문은?" />
              </Section>

              <Section id="authorAnalysis" icon={User} title="저자 및 배경 분석" {...sectionProps} hint='AI 프롬프트: "이 저자의 사상적 배경과 주요 관점을 분석해줘"'>
                <Field label="저자의 주요 관점/사상" multiline rows={3} value={workbook.step1.authorAnalysis.perspective} onChange={v => handleFieldChange('step1', 'authorAnalysis', 'perspective', v)} placeholder="저자가 세계를 바라보는 핵심 시각은?" />
                <Field label="사상적/학문적 배경" multiline rows={2} value={workbook.step1.authorAnalysis.background} onChange={v => handleFieldChange('step1', 'authorAnalysis', 'background', v)} placeholder="저자의 학문적 배경, 영향을 받은 사상가" />
                <Field label="시대적 맥락 & 지성사적 가치" multiline rows={2} value={workbook.step1.authorAnalysis.historicalContext} onChange={v => handleFieldChange('step1', 'authorAnalysis', 'historicalContext', v)} placeholder="이 책이 쓰인 시대적 배경과 의미" />
              </Section>

              <Section id="readingStrategy" icon={Target} title="독서 전략" {...sectionProps} hint="목차를 훑어보며 3가지 사전 질문을 만드세요. 질문이 있는 독서는 기억의 깊이가 다릅니다.">
                <Field label="사전 질문 1" value={workbook.step1.readingStrategy.question1} onChange={v => handleFieldChange('step1', 'readingStrategy', 'question1', v)} placeholder="이 책을 통해 알고 싶은 첫 번째 질문" />
                <Field label="사전 질문 2" value={workbook.step1.readingStrategy.question2} onChange={v => handleFieldChange('step1', 'readingStrategy', 'question2', v)} placeholder="두 번째 질문" />
                <Field label="사전 질문 3" value={workbook.step1.readingStrategy.question3} onChange={v => handleFieldChange('step1', 'readingStrategy', 'question3', v)} placeholder="세 번째 질문" />
                <Field label="이 책을 통해 얻고자 하는 구체적 목표" multiline rows={3} value={workbook.step1.readingStrategy.readingGoal} onChange={v => handleFieldChange('step1', 'readingStrategy', 'readingGoal', v)} placeholder="이 책을 읽은 후 나에게 어떤 변화가 있기를 바라는지" />
              </Section>

              <div className="wb-nav">
                <span />
                <button className="btn btn-primary" onClick={() => goToStep(2)}>다음: While Reading <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="animate-in">
              <Section id="chapterNotes" icon={KeyRound} title="키워드 요약노트 (챕터별)" {...sectionProps} hint="챕터별로 핵심 키워드 5개와 핵심 논지를 자기 언어로 정리하세요.">
                {workbook.step2.chapterNotes.map((cn, idx) => (
                  <div key={cn.id} className="wb-item">
                    <div className="wb-item-head">
                      <span>챕터 {idx + 1}</span>
                      {workbook.step2.chapterNotes.length > 1 && (
                        <button className="btn btn-ghost btn-sm btn-icon btn-danger-text" onClick={() => handleRemoveItem('step2', 'chapterNotes', cn.id)} aria-label="삭제"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <Field label="챕터명 / 주제" value={cn.chapterName} onChange={v => handleRepeatFieldChange('step2', 'chapterNotes', cn.id, 'chapterName', v)} placeholder="예: 인지 혁명, 3장" />
                    <div className="field">
                      <label>핵심 키워드 5개</label>
                      <div className="wb-kw-grid">
                        {cn.keywords.map((kw, ki) => (
                          <input key={ki} className="input" value={kw} onChange={(e) => handleKeywordChange(cn.id, ki, e.target.value)} placeholder={`키워드 ${ki + 1}`} />
                        ))}
                      </div>
                    </div>
                    <Field label="핵심 논지 (자기 언어로)" multiline rows={3} value={cn.coreSummary} onChange={v => handleRepeatFieldChange('step2', 'chapterNotes', cn.id, 'coreSummary', v)} placeholder="이 챕터에서 저자가 말하고자 하는 핵심을 내 말로 정리" />
                  </div>
                ))}
                <button className="btn btn-tinted btn-sm" onClick={() => handleAddItem('step2', 'chapterNotes')}><Plus size={14} /> 챕터 추가</button>
              </Section>

              <Section id="aiQnA" icon={MessageCircle} title="AI 심화 질의응답" {...sectionProps} hint="어려운 개념이 나오면 AI에게 물어보고, 그 설명과 나의 생각을 함께 기록하세요.">
                {workbook.step2.aiQnA.map((qa, idx) => (
                  <div key={qa.id} className="wb-item">
                    <div className="wb-item-head">
                      <span>질의 {idx + 1}</span>
                      {workbook.step2.aiQnA.length > 1 && (
                        <button className="btn btn-ghost btn-sm btn-icon btn-danger-text" onClick={() => handleRemoveItem('step2', 'aiQnA', qa.id)} aria-label="삭제"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <Field label="질문한 개념/용어" value={qa.concept} onChange={v => handleRepeatFieldChange('step2', 'aiQnA', qa.id, 'concept', v)} placeholder="예: 허구가 협력을 가능하게 한다는 것의 의미" />
                    <Field label="AI 설명 요약" multiline rows={3} value={qa.aiExplanation} onChange={v => handleRepeatFieldChange('step2', 'aiQnA', qa.id, 'aiExplanation', v)} placeholder="AI의 설명을 핵심만 정리" />
                    <Field label="나의 생각 (동의/반박/의문)" multiline rows={3} value={qa.myThoughts} onChange={v => handleRepeatFieldChange('step2', 'aiQnA', qa.id, 'myThoughts', v)} placeholder="이 설명에 대한 나의 반응과 생각" />
                  </div>
                ))}
                <button className="btn btn-tinted btn-sm" onClick={() => handleAddItem('step2', 'aiQnA')}><Plus size={14} /> 질의 추가</button>
              </Section>

              <Section id="quotes" icon={Quote} title="문장 수집" {...sectionProps} hint="읽으면서 마음에 남는 문장을 기록하세요. 페이지 번호를 함께 적어두면 나중에 찾기 쉽습니다.">
                {workbook.step2.quotes.map((q, idx) => (
                  <div key={q.id} className="wb-item">
                    <div className="wb-item-head">
                      <span>문장 {idx + 1}</span>
                      {workbook.step2.quotes.length > 1 && (
                        <button className="btn btn-ghost btn-sm btn-icon btn-danger-text" onClick={() => handleRemoveItem('step2', 'quotes', q.id)} aria-label="삭제"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <Field label="인상 깊은 문장" multiline rows={2} value={q.text} onChange={v => handleRepeatFieldChange('step2', 'quotes', q.id, 'text', v)} placeholder="인용할 문장을 여기에 기록하세요" />
                    <div className="field-row" style={{ gridTemplateColumns: '120px 1fr' }}>
                      <Field label="페이지" value={q.page} onChange={v => handleRepeatFieldChange('step2', 'quotes', q.id, 'page', v)} placeholder="p.123" />
                      <Field label="내 생각/메모" value={q.reflection} onChange={v => handleRepeatFieldChange('step2', 'quotes', q.id, 'reflection', v)} placeholder="이 문장이 왜 인상적이었는지" />
                    </div>
                  </div>
                ))}
                <button className="btn btn-tinted btn-sm" onClick={() => handleAddItem('step2', 'quotes')}><Plus size={14} /> 문장 추가</button>
              </Section>

              <div className="wb-nav">
                <button className="btn btn-secondary" onClick={() => goToStep(1)}><ArrowLeft size={16} /> Before Reading</button>
                <button className="btn btn-primary" onClick={() => goToStep(3)}>다음: After Reading <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="animate-in">
              <Section id="fourQuadrant" icon={Layers} title="4분할 압축 기록" {...sectionProps} hint="책 전체를 4가지 관점에서 압축하세요. 각 영역에 핵심만 담는 것이 중요합니다.">
                <div className="wb-quad">
                  {[
                    { key: 'knowledge', label: '지식 (요약)', icon: FileText, ph: '이 책의 핵심 지식을 한 문단으로' },
                    { key: 'critique', label: '비판 (동의/반박)', icon: Scale, ph: '저자의 주장에 동의/반박하는 나의 입장' },
                    { key: 'authorContext', label: '저자 (맥락)', icon: User, ph: '저자가 이 주장을 하는 맥락과 배경' },
                    { key: 'actionPlan', label: '액션 플랜 (3가지 행동)', icon: Target, ph: '1. …\n2. …\n3. …' },
                  ].map(cell => {
                    const Icon = cell.icon;
                    return (
                      <div key={cell.key} className="wb-quad-cell">
                        <h4><Icon size={13} /> {cell.label}</h4>
                        <textarea className="textarea" value={workbook.step3.fourQuadrant[cell.key] || ''} onChange={(e) => handleFieldChange('step3', 'fourQuadrant', cell.key, e.target.value)} placeholder={cell.ph} style={{ minHeight: 110, background: 'var(--fill-4)' }} />
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section id="realLife" icon={Target} title="실생활 적용" {...sectionProps} hint='AI 프롬프트: "이 책의 내용을 일, 인간관계, 자기계발 분야에 어떻게 적용할 수 있는지 구체적으로 알려줘"'>
                <Field label={<span className="flex items-center gap-2"><Briefcase size={13} /> 일/업무에 적용</span>} multiline rows={3} value={workbook.step3.realLifeApplication.work} onChange={v => handleFieldChange('step3', 'realLifeApplication', 'work', v)} placeholder="업무나 커리어에서 이 지식을 어떻게 활용할 것인가" />
                <Field label={<span className="flex items-center gap-2"><Users size={13} /> 인간관계에 적용</span>} multiline rows={3} value={workbook.step3.realLifeApplication.relationships} onChange={v => handleFieldChange('step3', 'realLifeApplication', 'relationships', v)} placeholder="관계에서 이 통찰을 어떻게 적용할 것인가" />
                <Field label={<span className="flex items-center gap-2"><Sprout size={13} /> 자기계발에 적용</span>} multiline rows={3} value={workbook.step3.realLifeApplication.selfDevelopment} onChange={v => handleFieldChange('step3', 'realLifeApplication', 'selfDevelopment', v)} placeholder="개인 성장에 어떻게 활용할 것인가" />
              </Section>

              <Section id="criticalThinking" icon={Scale} title="비판적 사고 & 확장" {...sectionProps} hint="건설적 비판은 지식을 더 단단하게 만듭니다. 저자의 논리에 빈틈이 있는지 찾아보세요.">
                <Field label={<span className="flex items-center gap-2"><AlertCircle size={13} /> 논리적 허점/한계점</span>} multiline rows={3} value={workbook.step3.criticalThinking.logicalGaps} onChange={v => handleFieldChange('step3', 'criticalThinking', 'logicalGaps', v)} placeholder="저자의 주장에서 약한 부분이나 반례는?" />
                <Field label={<span className="flex items-center gap-2"><Link2 size={13} /> 기존 지식과의 연결</span>} multiline rows={3} value={workbook.step3.criticalThinking.connectionToExisting} onChange={v => handleFieldChange('step3', 'criticalThinking', 'connectionToExisting', v)} placeholder="이전에 읽은 다른 책이나 아는 지식과 어떻게 연결되는가" />
                <Field label={<span className="flex items-center gap-2"><HelpCircle size={13} /> 추가 탐구 질문</span>} multiline rows={2} value={workbook.step3.criticalThinking.furtherQuestions} onChange={v => handleFieldChange('step3', 'criticalThinking', 'furtherQuestions', v)} placeholder="이 책을 읽고 나서 새롭게 생긴 궁금증은?" />
                <Field label={<span className="flex items-center gap-2"><Scale size={13} /> 다른 이론/책과 비교</span>} multiline rows={2} value={workbook.step3.criticalThinking.comparisonWithOthers} onChange={v => handleFieldChange('step3', 'criticalThinking', 'comparisonWithOthers', v)} placeholder="비슷한 주제의 다른 책/이론과 비교하면?" />
              </Section>

              <Section id="thirtyDay" icon={CalendarDays} title="30일 프로젝트" {...sectionProps} hint="책에서 배운 것을 4주간 실천하세요. 행동 없는 독서는 미완성입니다.">
                <div className="wb-quad">
                  {[
                    { key: 'week1', label: '1주차 (Day 1–7)', placeholder: '첫 주 실천 목표' },
                    { key: 'week2', label: '2주차 (Day 8–14)', placeholder: '두 번째 주 목표' },
                    { key: 'week3', label: '3주차 (Day 15–21)', placeholder: '세 번째 주 목표' },
                    { key: 'week4', label: '4주차 (Day 22–30)', placeholder: '마지막 주 목표 & 회고' },
                  ].map(week => (
                    <div key={week.key} className="wb-quad-cell">
                      <h4><CalendarDays size={13} /> {week.label}</h4>
                      <textarea className="textarea" value={workbook.step3.thirtyDayProject[week.key] || ''} onChange={(e) => handleFieldChange('step3', 'thirtyDayProject', week.key, e.target.value)} placeholder={week.placeholder} style={{ minHeight: 80, background: 'var(--fill-4)' }} />
                    </div>
                  ))}
                </div>
              </Section>

              <div className="wb-nav">
                <button className="btn btn-secondary" onClick={() => goToStep(2)}><ArrowLeft size={16} /> While Reading</button>
                <span className="wb-save ok"><Check size={13} /> 모든 입력은 자동 저장됩니다</span>
              </div>
            </div>
          )}
        </>
      )}

      <p className="t-footnote c-3 mt-6"><Info size={12} style={{ display: 'inline', verticalAlign: -2 }} /> 워크북은 ‘책 해부 워크북’ 양식을 기반으로 구성되어 있습니다.</p>
    </div>
  );
}
