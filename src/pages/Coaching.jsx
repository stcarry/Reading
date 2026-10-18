import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Map, Hammer, Link2, MessageCircle, FilePenLine,
  Send, BookOpen, ChevronRight, Sparkles, Loader2, Trash2,
  Mic, Users, GraduationCap, Brain, Info, Bot, ArrowUp, BookMarked,
} from 'lucide-react';
import { getBooks, getNotes, addNote, getCoachingSessions, addCoachingSession, updateCoachingSession } from '../data/store';
import { callOpenAI } from '../utils/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EmptyState, ConfirmDialog } from '../components/ui';

const STEPS = [
  { num: 1, icon: Map, title: '예열', subtitle: '구조 파악 · 지도 그리기', timing: '읽기 전' },
  { num: 2, icon: Hammer, title: '몰입', subtitle: '난관 돌파 · 벽 부수기', timing: '읽는 중' },
  { num: 3, icon: Link2, title: '중간점검', subtitle: '맥락 연결 · 점 잇기', timing: '챕터 후' },
  { num: 4, icon: FilePenLine, title: '정리', subtitle: '글 구조화 · 3단 구성', timing: '완독 후' },
  { num: 5, icon: MessageCircle, title: '내재화', subtitle: '설명·토론 · 완전한 내 것', timing: '최종' },
];

// 5단계 내재화 3가지 모드
const INTERNALIZE_MODES = [
  { key: 'explain', icon: Mic, title: '구술 설명', desc: 'AI에게 내가 이해한 내용을 설명하고 피드백 받기' },
  { key: 'author', icon: Users, title: '저자 토론', desc: '저자 페르소나와 질문 또는 반론 토론하기' },
  { key: 'lecture', icon: GraduationCap, title: '가상 강연', desc: 'AI = 청중, 내가 강연하고 AI가 질문' },
];

const STEP_PROMPTS = {
  1: (title, author) => `당신은 독서 코치 AI입니다. 사용자가 "${title}" (${author}) 을 읽기 시작하려고 합니다.

**1단계: 예열 - 구조 파악 (지도 그리기)**

이 책의 전체 구조를 파악할 수 있도록 도와주세요:
1. 책의 핵심 주제와 저자의 의도를 3문장으로 요약
2. 주요 챕터/파트 구조를 정리 (핵심 3개 챕터로 단순화)
3. 반드시 알아야 할 핵심 키워드 5개를 뽑아서 간단히 설명
4. 이 책을 읽을 때 "이것만은 주의 깊게 읽어라"라는 포인트 2가지

마치 500페이지의 두꺼운 책이 한 장의 지도로 정리되는 느낌으로 설명해주세요. 한국어로 답변하세요.`,

  2: (title) => `당신은 독서 코치 AI입니다. 사용자가 "${title}"를 읽는 중입니다.

**2단계: 몰입 - 난관 돌파 (벽 부수기)**

사용자가 읽다가 막히는 부분을 질문하면:
1. 쉬운 비유로 설명해주세요 (일상의 예시)
2. "결국 핵심은 이것이다"로 한 문장 정리
3. 독서 흐름이 끊기지 않도록 1분 안에 해결하는 느낌으로

원칙: 참지 말고 즉시 질문! 마치 옆에 앉은 과외 선생님처럼 즉문즉답해주세요. 한국어로 답변하세요.`,

  3: (title) => `당신은 독서 코치 AI입니다. 사용자가 "${title}"의 챕터를 읽었습니다.

**3단계: 중간점검 - 맥락 연결 (Active Recall)**

핵심 원칙: "선(先) 요약, 후(後) 피드백"
- AI에게 요약을 시키는 것이 아니라, 사용자가 먼저 키워드를 뽑고 요약한 뒤 AI가 검증합니다.

프로세스:
1. 사용자에게 "책을 덮고, 기억에만 의존해서 핵심 키워드 3개를 뽑아보세요"라고 안내
2. 사용자가 키워드/요약을 제시하면 → 정확도를 검증하고 부족한 부분 보완
3. "이 내용이 다음 챕터와 어떻게 연결되는지" 맥락 연결 질문
4. 점(Dot)이 선(Line)으로 이어지도록 도움

사용자가 능동적으로 사고할 때 기억이 10배 강해집니다. 한국어로 답변하세요.`,

  4: (title) => `당신은 독서 코치 AI입니다. 사용자가 "${title}"을 정리하려 합니다.

**4단계: 정리 - 글 구조화 (What / So What / Now What)**

사용자의 메모/키워드를 기반으로 3단 구조로 정리합니다:

3단 구조 프레임:
1. **본 것 (What/Fact)**: "저자가 무엇을 말했는가?" → 객관적인 사실 요약
2. **깨달은 것 (So What/Insight)**: "이게 나에게 왜 중요한가?" → 주관적 해석/통찰
3. **적용할 것 (Now What/Action)**: "그래서 무엇을 할 것인가?" → 구체적 행동 계획

프로세스: 메모 수집(재료 준비) → AI 초안 작성(구조 잡기) → 내 언어로 완성(내재화)

필수 원칙: AI가 작성한 초안은 반드시 '내 언어'와 '내 말투'로 고쳐 써야 합니다.
한국어로 답변하세요.`,

  '5_explain': (title) => `당신은 독서 코치 AI입니다. 사용자가 "${title}"을 내재화하려 합니다.

**5단계: 내재화 - 구술 설명 모드**

사용자가 이 책의 내용을 당신에게 설명할 것입니다.
- 사용자의 설명을 듣고, 맞는 부분은 "정확합니다!"라고 인정해주세요
- 부족하거나 빠진 부분이 있으면 "그런데 저자는 이 점도 강조했어요"라고 보완해주세요
- 절대 먼저 설명하지 마세요. 사용자가 주체적으로 말하도록 유도하세요
- 격려와 피드백을 적절히 섞어주세요

"말로 설명할 수 없으면 아는 것이 아닙니다." 한국어로 답변하세요.`,

  '5_author': (title, author) => `당신은 지금부터 "${title}"의 저자 ${author}입니다.

**5단계: 내재화 - 저자 토론 모드**

저자의 입장에서 사용자의 질문이나 반론에 대답해주세요:
- 저자의 핵심 논리와 철학을 반영하여 답변 또는 방어
- 사용자가 반론을 제기하면 그 주장을 요약하고, 저자의 입장에서 논리적으로 반박
- 사용자가 단순히 핵심 주장을 물으면 깊이 있는 설명 제공
- 좋은 포인트를 제시하면 인정하되, 더 깊은 논점을 도출
- 책에 없는 내용이더라도 저자의 관점에서 일관되게 답변

사용자와 깊이 있는 지적 대화 및 건설적 토론을 나눠주세요. 한국어로 답변하세요.`,

  '5_lecture': (title) => `당신은 "${title}"을 전혀 읽지 않은 대학생 청중입니다.

**5단계: 내재화 - 가상 강연 모드**

사용자가 이 책의 핵심 내용을 강연할 것입니다:
- 설명이 어렵거나 이해가 안 되면 날카롭게 질문하세요
- "그게 정확히 무슨 뜻이에요?", "예시를 들어주실 수 있나요?" 같은 돌발 질문
- 좋은 설명에는 "아~ 그런 뜻이군요!" 같은 반응
- 논리적 빈틈이 있으면 지적하세요
- 초심자의 눈높이에서 반응하세요

사용자가 강연을 통해 지식을 완전히 소화하도록 돕는 것이 목표입니다. 한국어로 답변하세요.`,
};

const getStepIntro = (step, title) => ({
  1: `**${title}**의 구조를 파악해봅시다.\n\n이 단계에서는 책의 전체 지형을 미리 살펴봅니다. 500페이지의 두꺼운 책도 핵심 3개 챕터로 정리할 수 있습니다.\n\n**"시작"이라고 입력하면 이 책의 구조를 분석해드릴게요.** 궁금한 점을 바로 물어보셔도 됩니다.`,
  2: `**${title}** 읽기 모드를 시작합니다.\n\n읽다가 이해가 안 되는 문장이나 개념이 있으면 바로 물어보세요. 참지 말고 즉시 질문하면 1분 안에 쉬운 비유로 설명해드릴게요.\n\n**팁:** "~가 무슨 뜻이야?", "~를 쉽게 설명해줘"처럼 편하게 물어보세요. 보이스 모드를 권장합니다 — 옆에 있는 과외 선생님처럼.`,
  3: `**${title}** 중간점검 시간입니다.\n\n**핵심 원칙: 선(先) 요약, 후(後) 피드백.** AI에게 의존하지 말고, 내가 먼저 사고합니다.\n\n**지금 바로 해보세요:**\n1. 책을 덮으세요\n2. 기억에만 의존해서 **핵심 키워드 3개**를 뽑아보세요\n3. 아래 폼에 챕터명·키워드·요약을 입력하세요\n\n제가 검증해드리고, 다음 챕터와의 연결고리도 알려드릴게요.`,
  4: `**${title}** 정리 단계입니다.\n\n**What / So What / Now What 3단 구조**로 정리합니다.\n\n| 구조 | 질문 |\n|---|---|\n| 본 것 (What) | "저자가 무엇을 말했는가?" |\n| 깨달은 것 (So What) | "이게 나에게 왜 중요한가?" |\n| 적용할 것 (Now What) | "그래서 무엇을 할 것인가?" |\n\n**먼저, 읽으면서 남긴 메모나 키워드를 붙여넣어 주세요.** 3단 구조로 초안을 잡아드릴게요. 그 후에 내 언어로 완성하세요.`,
}[step]);

const getInternalizeIntro = (mode, title, author) => ({
  explain: `**구술 설명 모드**를 시작합니다.\n\n지금부터 **${title}**의 내용을 저에게 설명해주세요. 친구에게 이야기하듯 편하게, 완벽하지 않아도 괜찮습니다. 생각나는 대로 이야기해보세요.\n\n맞는 부분은 인정하고, 부족한 부분은 보완해드릴게요.\n\n*"설명할 수 없다면, 이해한 것이 아니다." — 아인슈타인*`,
  author: `**저자 토론 모드**를 시작합니다.\n\n안녕하세요, 저는 **${author}**입니다. **${title}**에 대해 궁금한 것이 있거나 동의하지 않는 내용이 있다면 자유롭게 말씀해 주세요.\n\n**추천 활용법**\n- 질문하기: "이 주장의 핵심 근거가 무엇인가요?"\n- 반박하기: "저는 ~부분에 동의하지 않아요. 왜냐하면…"\n- 통찰 나누기: "~에 대해 이렇게 판단했는데 맞나요?"`,
  lecture: `**가상 강연 모드**를 시작합니다.\n\n안녕하세요! 저는 **${title}**을 전혀 읽지 않은 대학생입니다. 이 책에 대해 강연을 해주신다니 기대돼요.\n\n**규칙**\n- 저는 아무것도 모릅니다. 쉽게 설명해주세요\n- 이해가 안 되면 날카롭게 질문할 거예요\n- 논리적 빈틈이 있으면 지적할 거예요\n\n준비되셨으면 강연을 시작해주세요.`,
}[mode]);

export default function Coaching() {
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [internalizeMode, setInternalizeMode] = useState(null);
  const [step3Form, setStep3Form] = useState({ chapter: '', keywords: '', summary: '' });
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [chapterSuggestions, setChapterSuggestions] = useState([]);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (!selectedBook) return;
    getNotes().then(all => {
      const used = all.filter(n => n.bookId === selectedBook.id).map(n => n.chapter).filter(Boolean);
      setChapterSuggestions([...new Set([...used, ...(selectedBook.chapters || [])])]);
    });
  }, [selectedBook, messages.length]);

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const startEditing = (idx, content) => { setEditingMessageIdx(idx); setEditingContent(content); };
  const saveEditing = (idx) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, content: editingContent } : m));
    setEditingMessageIdx(null);
  };
  const deleteMessage = (idx) => { setMessages(prev => prev.filter((_, i) => i !== idx)); setDeleteIdx(null); };

  useEffect(() => {
    const syncSession = async () => {
      if (currentSessionId && messages.length > 0) {
        try { await updateCoachingSession(currentSessionId, { messages }); }
        catch (err) { console.error('Session sync failed:', err); }
      }
    };
    syncSession();
  }, [messages, currentSessionId]);

  const handleStep3Submit = async () => {
    if (!step3Form.chapter.trim() || !step3Form.keywords.trim() || !step3Form.summary.trim() || isLoading) return;
    if (!selectedBook) { alert('코칭할 책을 먼저 선택해주세요.'); return; }

    await addNote({
      bookId: selectedBook.id,
      type: 'keyword',
      chapter: step3Form.chapter,
      keywords: step3Form.keywords.split(/[,\s]+/).filter(k => k.trim()),
      content: step3Form.summary,
      category: 'knowledge',
    });

    const promptText = `방금 읽은 [${step3Form.chapter}] 챕터의 키워드는 [${step3Form.keywords}]이고, 내용은 "${step3Form.summary}"로 요약했어. 이 키워드 선정이 적절한지 평가해주고, 다음 챕터와의 연결고리를 피드백 해줘.`;
    const newMessages = [...messages, { role: 'user', content: promptText }];
    userScrollRef.current = true;
    setMessages(newMessages);
    setStep3Form({ chapter: '', keywords: '', summary: '' });
    setIsLoading(true);
    try {
      const aiResponse = await callOpenAI(newMessages, 'gpt-4o');
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBooks().then(allBooks => {
      setBooks(allBooks);
      const bookId = searchParams.get('bookId');
      if (bookId) {
        const book = allBooks.find(b => b.id === bookId);
        if (book) {
          const stepParam = parseInt(searchParams.get('step'), 10);
          const step = stepParam >= 1 && stepParam <= 5 ? stepParam : 1;
          setSelectedBook(book);
          startStep(step, book);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const chatBodyRef = useRef(null);
  const userScrollRef = useRef(false);
  useEffect(() => {
    const body = chatBodyRef.current;
    if (!body) return;
    if (body.scrollHeight > body.clientHeight + 4) {
      body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    } else if (userScrollRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    userScrollRef.current = false;
  }, [messages, isLoading]);

  const readingBooks = books.filter(b => b.status === 'reading');

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setMessages([]); setCurrentSessionId(null); setCurrentStep(1); setInternalizeMode(null);
    setStep3Form({ chapter: '', keywords: '', summary: '' });
    setTimeout(() => startStep(1, book), 0);
  };

  const startStep = async (step, bookOverride = null) => {
    const book = bookOverride || selectedBook;
    if (!book) return;
    if (step === 5) {
      setCurrentStep(5); setInternalizeMode(null); setMessages([]); setCurrentSessionId(null);
      return;
    }
    const sessions = await getCoachingSessions();
    const session = sessions.find(s => s.bookId === book.id && String(s.step) === String(step));
    if (session && session.messages?.length > 0) {
      setMessages(session.messages);
      setCurrentSessionId(session.id);
    } else {
      const initialMessages = [
        { role: 'system', content: STEP_PROMPTS[step](book.title, book.author) },
        { role: 'ai', content: getStepIntro(step, book.title) },
      ];
      const newSession = await addCoachingSession({ bookId: book.id, step, messages: initialMessages });
      setCurrentSessionId(newSession.id);
      setMessages(initialMessages);
    }
    setCurrentStep(step);
    setInternalizeMode(null);
  };

  const startInternalizeMode = async (mode) => {
    setInternalizeMode(mode);
    const stepKey = `5_${mode}`;
    const sessions = await getCoachingSessions();
    const session = sessions.find(s => s.bookId === selectedBook.id && String(s.step) === stepKey);
    if (session && session.messages?.length > 0) {
      setMessages(session.messages);
      setCurrentSessionId(session.id);
    } else {
      const initialMessages = [
        { role: 'system', content: STEP_PROMPTS[stepKey](selectedBook.title, selectedBook.author) },
        { role: 'ai', content: getInternalizeIntro(mode, selectedBook.title, selectedBook.author) },
      ];
      const newSession = await addCoachingSession({ bookId: selectedBook.id, step: stepKey, messages: initialMessages });
      setCurrentSessionId(newSession.id);
      setMessages(initialMessages);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let userContent = input;
    const isFirstUserMessageInStep4 = currentStep === 4 && messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMessageInStep4) {
      userContent = input + "\n\n[내재된 지시사항] 위 재료들을 바탕으로 독서 노트 초안을 작성해줘. 키워드 개조식으로 만들면 좋겠어. Key message(본것), Insight(깨달은 것), Action(적용할 것) 3단 구조로 정리하면 좋겠어.";
    }
    const newMessages = [...messages, { role: 'user', content: userContent, displayContent: input }];
    userScrollRef.current = true;
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const aiResponse = await callOpenAI(newMessages, 'gpt-4o');
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeStep = STEPS[currentStep - 1];
  const activeMode = INTERNALIZE_MODES.find(m => m.key === internalizeMode);
  const HeadIcon = activeMode?.icon || activeStep.icon;
  const visibleMessages = messages.map((m, i) => ({ m, i })).filter(({ m }) => m.role !== 'system');
  const suggestions = currentStep === 1 ? [
    `${selectedBook?.author}의 '${selectedBook?.title}'에서 말하는 [주요 개념]이 목차에 나오더라. 이거 핵심만 알려줘.`,
    `${selectedBook?.author}의 집필 의도 알려줘.`,
    `작가가 이 책을 집필할 당시의 사회 환경과의 관련성 알려줘.`,
    `목차 보다보니 [핵심 키워드]라는 개념이 중요하던데, 이해하기 쉬운 수준으로 알려줘.`,
  ] : [
    `${selectedBook?.author}의 '${selectedBook?.title}'에서 [     ] 내용이 이해가 안 가. 책의 내용에 관련 있는 범위 내에서 쉬운 비유로 설명해줘.`,
  ];

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI 독서 코칭</h1>
          <p className="page-subtitle">5단계 독서법으로 책을 깊이 이해하고 완전히 내 것으로 만드세요</p>
        </div>
      </div>

      <div className="callout mb-6">
        <Info size={18} />
        <div><strong>AI는 도구, 나는 주체.</strong> 생각의 주체는 여러분입니다. AI는 돕는 도구일 뿐이며, 순서가 바뀌면 안 됩니다.</div>
      </div>

      {!selectedBook ? (
        <>
          <div className="section-head"><h2>코칭할 책 선택</h2><span className="meta">읽는 중인 책 {readingBooks.length}권</span></div>
          {readingBooks.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={24} />}
              title="읽고 있는 책이 없어요"
              desc="서재에서 책 상태를 ‘읽는 중’으로 바꾸면 여기에 표시됩니다."
            />
          ) : (
            <div className="list">
              {readingBooks.map(book => (
                <button key={book.id} className="list-row interactive" onClick={() => handleSelectBook(book)}>
                  <div className="cover cover-sm">
                    {book.cover ? <img src={book.cover} alt="" /> : <BookMarked size={16} />}
                  </div>
                  <div className="list-body">
                    <div className="list-title">{book.title}</div>
                    <div className="list-sub">{book.author}</div>
                  </div>
                  <span className="btn btn-tinted btn-sm"><Sparkles size={13} /> 코칭 시작</span>
                  <ChevronRight size={16} className="list-chevron" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* 선택된 책 */}
          <div className="co-book-bar">
            <div className="cover">{selectedBook.cover ? <img src={selectedBook.cover} alt="" /> : <BookMarked size={14} />}</div>
            <div className="flex-1">
              <div className="co-book-title truncate">{selectedBook.title}</div>
              <div className="co-book-author truncate">{selectedBook.author}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedBook(null); setMessages([]); setInternalizeMode(null); }}>책 변경</button>
          </div>

          {/* 단계 선택 */}
          <div className="steps cols-5" role="tablist" aria-label="코칭 단계">
            {STEPS.map(step => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  role="tab"
                  aria-selected={isActive}
                  className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  data-step={step.num}
                  onClick={() => startStep(step.num)}
                  title={`${step.num}단계 ${step.title} · ${step.timing}`}
                >
                  <div className="step-top">
                    <span className="step-num">{step.num}</span>
                    <span className="step-title">{step.title}</span>
                  </div>
                  <span className="step-sub">{step.subtitle}</span>
                  <span className="step-timing">{step.timing}</span>
                </button>
              );
            })}
          </div>

          {/* 5단계 모드 선택 */}
          {currentStep === 5 && !internalizeMode && (
            <div className="card mt-4">
              <div className="text-center mb-6">
                <div className="list-icon" style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px' }}><Brain size={22} /></div>
                <h3 className="t-title3">내재화 모드를 선택하세요</h3>
                <p className="t-footnote c-2 mt-2">“설명할 수 없다면, 이해한 것이 아니다” — 아인슈타인</p>
                <div className="co-pyramid-mini">
                  <span>읽기 <strong>10%</strong></span>
                  <ChevronRight size={12} />
                  <span>토론 <strong>50%</strong></span>
                  <ChevronRight size={12} />
                  <span>가르치기 <strong>90%</strong></span>
                </div>
              </div>
              <div className="list">
                {INTERNALIZE_MODES.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button key={mode.key} className="list-row with-icon interactive" onClick={() => startInternalizeMode(mode.key)}>
                      <div className="list-icon"><Icon size={16} /></div>
                      <div className="list-body">
                        <div className="list-title">{mode.title}</div>
                        <div className="list-sub">{mode.desc}</div>
                      </div>
                      <ChevronRight size={16} className="list-chevron" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 대화 */}
          {(currentStep !== 5 || internalizeMode) && (
            <section className="chat" aria-label="코칭 대화">
              <div className="chat-head">
                <div className="list-icon"><HeadIcon size={16} /></div>
                <div className="flex-1">
                  <div className="chat-head-title">
                    {currentStep}단계 {activeStep.title}
                    {activeMode && <span> · {activeMode.title}</span>}
                  </div>
                  <div className="chat-head-sub">{activeMode ? activeMode.desc : activeStep.subtitle}</div>
                </div>
                {activeMode && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setInternalizeMode(null); setMessages([]); }}>모드 변경</button>
                )}
              </div>

              <div className="chat-body" ref={chatBodyRef}>
                {visibleMessages.length === 0 ? (
                  <div className="empty" style={{ padding: 'var(--s-8)' }}>
                    <div className="empty-desc">위의 단계를 선택하면 코칭이 시작됩니다.</div>
                  </div>
                ) : (
                  visibleMessages.map(({ m: msg, i: idx }) => (
                    <div key={idx} className={`chat-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                      <div className="chat-avatar"><Bot size={15} /></div>
                      <div className="chat-bubble-wrap">
                      <div className="chat-bubble">
                        {editingMessageIdx === idx ? (
                          <div className="flex flex-col gap-2">
                            <textarea className="textarea" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} style={{ minHeight: 160, background: 'var(--bg-base)' }} />
                            <div className="flex justify-end gap-2">
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingMessageIdx(null)}>취소</button>
                              <button className="btn btn-primary btn-sm" onClick={() => saveEditing(idx)}>저장</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="markdown">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.displayContent || msg.content}</ReactMarkdown>
                            </div>
                          </>
                        )}
                      </div>
                      {editingMessageIdx !== idx && (
                        <div className="chat-bubble-actions">
                          {currentStep === 4 && msg.role === 'ai' && idx > 1 && (
                            <button className="btn btn-ghost btn-sm" onClick={() => startEditing(idx, msg.content)} title="내 언어로 다듬기"><FilePenLine size={13} /> 다듬기</button>
                          )}
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteIdx(idx)} aria-label="메시지 삭제" title="삭제"><Trash2 size={13} /></button>
                        </div>
                      )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="chat-msg ai">
                    <div className="chat-avatar"><Bot size={15} /></div>
                    <div className="chat-bubble"><span className="chat-typing"><Loader2 size={14} className="spinner" /> 생각하고 있어요…</span></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 추천 질문 */}
              {messages.length > 0 && (currentStep === 1 || currentStep === 2) && (
                <div className="chat-suggest">
                  <div className="chat-suggest-label">추천 질문 — 누르면 입력창에 추가됩니다</div>
                  <div className="chip-scroll">
                    {suggestions.map((prompt, idx) => (
                      <button key={idx} className="chip" onClick={() => setInput(prev => prev ? `${prev}\n${prompt}` : prompt)} title={prompt}>
                        {prompt.length > 44 ? prompt.substring(0, 44) + '…' : prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 입력 */}
              <div className="chat-foot">
                {currentStep === 3 && !internalizeMode ? (
                  <div className="co-form">
                    <div className="co-form-title">중간점검 · 노트 기록 — 저장 시 기록 노트에 자동으로 쌓입니다</div>
                    <input
                      className="input" list="coaching-chapter-suggestions"
                      placeholder="방금 읽은 챕터명 (예: 3장 운동 기억) — 번호를 넣으면 순서대로 정렬됩니다"
                      value={step3Form.chapter}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, chapter: e.target.value }))}
                      disabled={messages.length === 0}
                    />
                    <datalist id="coaching-chapter-suggestions">
                      {chapterSuggestions.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <input
                      className="input"
                      placeholder="핵심 키워드 3~5개 (쉼표로 구분. 예: 허구, 협력, 신화)"
                      value={step3Form.keywords}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, keywords: e.target.value }))}
                      disabled={messages.length === 0}
                    />
                    <textarea
                      className="textarea"
                      placeholder="과감한 요약 — 책을 덮고, 내 기억에 의존해서 작성해보세요"
                      value={step3Form.summary}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, summary: e.target.value }))}
                      disabled={messages.length === 0}
                      style={{ minHeight: 72 }}
                    />
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleStep3Submit}
                      disabled={!step3Form.chapter.trim() || !step3Form.keywords.trim() || !step3Form.summary.trim() || isLoading || messages.length === 0}
                    >
                      <Sparkles size={16} /> AI 검증 및 노트에 저장
                    </button>
                  </div>
                ) : (
                  <div className="chat-input">
                    <textarea
                      ref={chatInputRef}
                      placeholder={
                        currentStep === 4 ? '메모나 키워드를 붙여넣어 주세요…'
                        : internalizeMode === 'explain' ? '이 책의 내용을 설명해보세요…'
                        : internalizeMode === 'author' ? '저자에게 질문하거나 반론을 제시해보세요…'
                        : internalizeMode === 'lecture' ? '강연을 시작해보세요…'
                        : '질문이나 답변을 입력하세요…'
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      disabled={messages.length === 0}
                      id="coaching-input"
                      rows={1}
                      aria-label="메시지 입력"
                    />
                    <button className="chat-send" onClick={handleSend} disabled={!input.trim() || isLoading || messages.length === 0} aria-label="보내기">
                      {isLoading ? <Loader2 size={16} className="spinner" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteIdx !== null}
        onClose={() => setDeleteIdx(null)}
        onConfirm={() => deleteMessage(deleteIdx)}
        icon={<Trash2 size={22} />}
        danger
        title="이 메시지를 삭제할까요?"
        desc="삭제한 메시지는 되돌릴 수 없습니다."
        confirmLabel="삭제"
      />
    </div>
  );
}
