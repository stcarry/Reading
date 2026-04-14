import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Map, Hammer, Link2, FileEdit, MessageCircle,
  Send, BookOpen, ChevronRight, Sparkles, Loader, Trash2, FileEdit,
  Mic, Users, Swords, GraduationCap, Brain, AlertCircle
} from 'lucide-react';
import { getBooks, getBooksByStatus, addNote, getCoachingSessions, addCoachingSession, updateCoachingSession } from '../data/store';
import { callOpenAI } from '../utils/openai';

const STEPS = [
  { num: 1, icon: Map, title: '예열', subtitle: '구조 파악 (지도 그리기)', color: 'teal', emoji: '🗺', timing: '읽기 전' },
  { num: 2, icon: Hammer, title: '몰입', subtitle: '난관 돌파 (벽 부수기)', color: 'amber', emoji: '🔨', timing: '읽는 중' },
  { num: 3, icon: Link2, title: '중간점검', subtitle: '맥락 연결 (점 잇기)', color: 'violet', emoji: '🔗', timing: '챕터 후' },
  { num: 4, icon: FileEdit, title: '정리', subtitle: '글 구조화 (3단 구성)', color: 'rose', emoji: '✏️', timing: '완독 후' },
  { num: 5, icon: MessageCircle, title: '내재화', subtitle: '설명·토론 (완전한 내 것)', color: 'green', emoji: '💬', timing: '최종' },
];

// 5단계 내재화 3가지 모드
const INTERNALIZE_MODES = [
  { key: 'explain', icon: Mic, emoji: '🎤', title: '구술 설명', desc: 'AI에게 내가 이해한 내용을 설명하고 피드백 받기', color: 'teal' },
  { key: 'author', icon: Users, emoji: '💬', title: '저자 토론', desc: '저자 페르소나와 질문 또는 반론 토론하기', color: 'amber' },
  { key: 'lecture', icon: GraduationCap, emoji: '🎓', title: '가상 강연', desc: 'AI = 청중, 내가 강연하고 AI가 질문', color: 'violet' },
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

⚠️ 핵심 원칙: "선(先) 요약, 후(後) 피드백"
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

📋 3단 구조 프레임:
1. **본 것 (What/Fact)**: "저자가 무엇을 말했는가?" → 객관적인 사실 요약
2. **깨달은 것 (So What/Insight)**: "이게 나에게 왜 중요한가?" → 주관적 해석/통찰
3. **적용할 것 (Now What/Action)**: "그래서 무엇을 할 것인가?" → 구체적 행동 계획

프로세스: 메모 수집(재료 준비) → AI 초안 작성(구조 잡기) → 내 언어로 완성(내재화)

⚠️ 필수 원칙: AI가 작성한 초안은 반드시 '내 언어'와 '내 말투'로 고쳐 써야 합니다.
한국어로 답변하세요.`,

  // 5단계는 모드별로 분기
  '5_explain': (title) => `당신은 독서 코치 AI입니다. 사용자가 "${title}"을 내재화하려 합니다.

**5단계: 내재화 - 🎤 구술 설명 모드**

사용자가 이 책의 내용을 당신에게 설명할 것입니다.
- 사용자의 설명을 듣고, 맞는 부분은 "정확합니다!"라고 인정해주세요
- 부족하거나 빠진 부분이 있으면 "그런데 저자는 이 점도 강조했어요"라고 보완해주세요
- 절대 먼저 설명하지 마세요. 사용자가 주체적으로 말하도록 유도하세요
- 격려와 피드백을 적절히 섞어주세요

"말로 설명할 수 없으면 아는 것이 아닙니다." 한국어로 답변하세요.`,

  '5_author': (title, author) => `당신은 지금부터 "${title}"의 저자 ${author}입니다.

**5단계: 내재화 - 💬 저자 토론 모드**

저자의 입장에서 사용자의 질문이나 반론에 대답해주세요:
- 저자의 핵심 논리와 철학을 반영하여 답변 또는 방어
- 사용자가 반론을 제기하면 그 주장을 요약하고, 저자의 입장에서 논리적으로 반박
- 사용자가 단순히 핵심 주장을 물으면 깊이 있는 설명 제공
- 좋은 포인트를 제시하면 인정하되, 더 깊은 논점을 도출
- 책에 없는 내용이더라도 저자의 관점에서 일관되게 답변

사용자와 깊이 있는 지적 대화 및 건설적 토론을 나눠주세요. 한국어로 답변하세요.`,

  '5_lecture': (title) => `당신은 "${title}"을 전혀 읽지 않은 대학생 청중입니다.

**5단계: 내재화 - 🎓 가상 강연 모드**

사용자가 이 책의 핵심 내용을 강연할 것입니다:
- 설명이 어렵거나 이해가 안 되면 날카롭게 질문하세요
- "그게 정확히 무슨 뜻이에요?", "예시를 들어주실 수 있나요?" 같은 돌발 질문
- 좋은 설명에는 "아~ 그런 뜻이군요!" 같은 반응
- 논리적 빈틈이 있으면 지적하세요
- 초심자의 눈높이에서 반응하세요

사용자가 강연을 통해 지식을 완전히 소화하도록 돕는 것이 목표입니다. 한국어로 답변하세요.`,
};

export default function Coaching() {
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [internalizeMode, setInternalizeMode] = useState(null); // 5단계 모드
  const [step3Form, setStep3Form] = useState({ chapter: '', keywords: '', summary: '' });
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const startEditing = (idx, content) => {
    setEditingMessageIdx(idx);
    setEditingContent(content);
  };

  const saveEditing = (idx) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, content: editingContent } : m));
    setEditingMessageIdx(null);
  };

  const deleteMessage = (idx) => {
    if (window.confirm('이 메시지를 삭제할까요?')) {
      const newMessages = messages.filter((_, i) => i !== idx);
      setMessages(newMessages);
    }
  };

  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateCoachingSession(currentSessionId, { messages });
    }
  }, [messages, currentSessionId]);

  const handleStep3Submit = async () => {
    if (!step3Form.chapter.trim() || !step3Form.keywords.trim() || !step3Form.summary.trim() || isLoading) return;
    
    // 기록노트(Notes)에 저장
    addNote({
      bookId: selectedBook.id,
      type: 'keyword',
      chapter: step3Form.chapter,
      keywords: step3Form.keywords.split(',').map(k => k.trim()),
      content: step3Form.summary,
      category: 'knowledge'
    });

    // 채팅창 프롬프트 구성 및 실행
    const promptText = `방금 읽은 [${step3Form.chapter}] 챕터의 키워드는 [${step3Form.keywords}]이고, 내용은 "${step3Form.summary}"로 요약했어. 이 키워드 선정이 적절한지 평가해주고, 다음 챕터와의 연결고리를 피드백 해줘.`;
    
    const userMessage = { role: 'user', content: promptText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // 폼 초기화
    setStep3Form({ chapter: '', keywords: '', summary: '' });
    setIsLoading(true);

    try {
      const modelToUse = 'gpt-4o'; // o1-mini 접근 권한 이슈로 인해 gpt-4o로 통합 사용
      const aiResponse = await callOpenAI(newMessages, modelToUse);
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ 에러 발생: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const allBooks = getBooks();
    setBooks(allBooks);
    const bookId = searchParams.get('bookId');
    if (bookId) {
      const book = allBooks.find(b => b.id === bookId);
      if (book) setSelectedBook(book);
    }
  }, [searchParams]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const readingBooks = books.filter(b => b.status === 'reading');

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setMessages([]);
    setCurrentSessionId(null);
    setCurrentStep(1);
    setInternalizeMode(null);
    setStep3Form({ chapter: '', keywords: '', summary: '' });
    setTimeout(() => startStep(1, book), 0);
  };

  const startStep = (step, bookOverride = null) => {
    const book = bookOverride || selectedBook;
    if (!book) return;
    if (step === 5) {
      setCurrentStep(5);
      setInternalizeMode(null);
      setMessages([]);
      setCurrentSessionId(null);
      return;
    }
    
    // 세션 기록 불러오기
    const sessions = getCoachingSessions();
    const session = sessions.find(s => s.bookId === book.id && s.step === step);
    
    if (session && session.messages?.length > 0) {
      setMessages(session.messages);
      setCurrentSessionId(session.id);
    } else {
      const systemPrompt = STEP_PROMPTS[step](book.title, book.author);
      const initialMessages = [{
        role: 'system',
        content: systemPrompt,
      }, {
        role: 'ai',
        content: getStepIntro(step, book.title),
      }];
      const newSession = addCoachingSession({ bookId: book.id, step, messages: initialMessages });
      setCurrentSessionId(newSession.id);
      setMessages(initialMessages);
    }
    
    setCurrentStep(step);
    setInternalizeMode(null);
  };

  const startInternalizeMode = (mode) => {
    setInternalizeMode(mode);
    const stepKey = `5_${mode}`;
    const sessions = getCoachingSessions();
    const session = sessions.find(s => s.bookId === selectedBook.id && s.step === stepKey);
    
    if (session && session.messages?.length > 0) {
      setMessages(session.messages);
      setCurrentSessionId(session.id);
    } else {
      const promptKey = `5_${mode}`;
      const systemPrompt = STEP_PROMPTS[promptKey](selectedBook.title, selectedBook.author);
      const initialMessages = [{
        role: 'system',
        content: systemPrompt,
      }, {
        role: 'ai',
        content: getInternalizeIntro(mode, selectedBook.title, selectedBook.author),
      }];
      const newSession = addCoachingSession({ bookId: selectedBook.id, step: stepKey, messages: initialMessages });
      setCurrentSessionId(newSession.id);
      setMessages(initialMessages);
    }
  };

  const getStepIntro = (step, title) => {
    const intros = {
      1: `🗺 **${title}**의 구조를 파악해봅시다!\n\n이 단계에서는 책의 전체 지형을 미리 살펴봅니다.\n500페이지의 두꺼운 책도 핵심 3개 챕터로 정리할 수 있습니다.\n\n**"시작"이라고 입력하면 제가 이 책의 구조를 분석해드릴게요.**\n또는 궁금한 점을 바로 물어보셔도 됩니다.`,
      2: `🔨 **${title}** 읽기 모드 시작!\n\n읽다가 이해가 안 되는 문장이나 개념이 있으면 바로 물어보세요.\n참지 말고 즉시 질문! 1분 안에 쉬운 비유로 설명해드릴게요.\n\n💡 **팁:** "~가 무슨 뜻이야?", "~를 쉽게 설명해줘" 같이 편하게 물어보세요.\n🎤 보이스 모드를 권장합니다 — 마치 옆에 있는 과외 선생님처럼!`,
      3: `🔗 **${title}** 중간점검 시간!\n\n📌 **핵심 원칙: 선(先) 요약, 후(後) 피드백**\nAI에게 의존하지 말고, 내가 먼저 사고합니다.\n\n**지금 바로 해보세요:**\n1. 📕 책을 덮으세요\n2. 🧠 기억에만 의존해서 **핵심 키워드 3개**를 뽑아보세요\n3. 💬 뽑은 키워드를 여기에 입력하세요\n\n✅ 제가 검증해드리고, 다음 챕터와의 연결고리도 알려드릴게요!`,
      4: `✏️ **${title}** 정리 단계입니다!\n\n📐 **What / So What / Now What 3단 구조**로 정리합니다.\n\n| 구조 | 질문 |\n|---|---|\n| 본 것 (What) | "저자가 무엇을 말했는가?" |\n| 깨달은 것 (So What) | "이게 나에게 왜 중요한가?" |\n| 적용할 것 (Now What) | "그래서 무엇을 할 것인가?" |\n\n**먼저, 읽으면서 남긴 메모나 키워드를 붙여넣어 주세요.**\n제가 3단 구조로 초안을 잡아드릴게요. 그 후에 내 언어로 완성하세요!`,
    };
    return intros[step];
  };

  const getInternalizeIntro = (mode, title, author) => {
    const intros = {
      explain: `🎤 **구술 설명 모드** 시작!\n\n지금부터 **${title}**의 내용을 저에게 설명해주세요.\n\n마치 친구에게 통화하듯 편하게 시작하세요.\n완벽하지 않아도 됩니다. 생각나는 대로 주절주절 이야기해도 괜찮아요!\n\n맞는 부분은 인정하고, 부족한 부분은 보완해드릴게요.\n\n**"설명할 수 없다면, 이해한 것이 아니다." - 아인슈타인**\n\n준비되셨으면 설명을 시작해주세요! 🎙`,
      author: `💬 **저자 토론 모드** 시작!\n\n안녕하세요. 저는 **${author}**입니다.\n**${title}**에 대해 궁금한 것이 있거나, 동의하지 않는 내용이 있다면 자유롭게 말씀해 주세요!\n\n저와 함께 깊이 있는 대화와 건설적인 토론을 나눠봅시다.\n\n💡 **추천 활용법:**\n- 질문하기: "이 주장의 핵심 근거가 무엇인가요?"\n- 반박하기: "저는 ~부분에 동의하지 않아요. 왜냐하면..."\n- 통찰 나누기: "~에 대해 이렇게 판단했는데 맞나요?"`,
      lecture: `🎓 **가상 강연 모드** 시작!\n\n안녕하세요! 저는 **${title}**을 전혀 읽지 않은 대학생입니다.\n이 책에 대해 강연을 해주신다니 기대돼요!\n\n📢 **규칙:**\n- 저는 아무것도 모릅니다. 쉽게 설명해주세요\n- 이해가 안 되면 날카롭게 질문할 거예요\n- 좋은 설명에는 감탄할 거예요 😲\n- 논리적 빈틈이 있으면 지적할 거예요\n\n준비되셨으면 강연을 시작해주세요! 🙋‍♂️`,
    };
    return intros[mode];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    let userContent = input;
    // 4단계: 첫 번째 사용자 입력에 내재된 프롬프트 자동 추가
    const isFirstUserMessageInStep4 = currentStep === 4 && messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMessageInStep4) {
      userContent = input + "\n\n[내재된 지시사항] 위 재료들을 바탕으로 독서 노트 초안을 작성해줘. 키워드 개조식으로 만들면 좋겠어. Key message(본것), Insight(깨달은 것), Action(적용할 것) 3단 구조로 정리하면 좋겠어.";
    }

    const userMessage = { role: 'user', content: userContent, displayContent: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const modelToUse = currentStep === 1 ? 'o1-mini' : 'gpt-4o';
      const aiResponse = await callOpenAI(newMessages, modelToUse);
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ 에러 발생: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">AI 독서 코칭 🧠</h1>
        <p className="page-subtitle">
          AI 5단계 독서법으로 책을 깊이 이해하고 완전히 내 것으로 만드세요
        </p>
      </div>

      {/* Core Principle Banner */}
      <div className="glass-card-static mb-6" style={{
        padding: 'var(--space-3) var(--space-5)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(20,184,166,0.03))',
        border: '1px solid rgba(245,158,11,0.1)',
      }}>
        <AlertCircle size={18} style={{ color: 'var(--amber-400)', flexShrink: 0 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--amber-400)' }}>핵심 원칙:</strong>{' '}
          "AI는 도구, 나는 주체" — 생각의 주체는 여러분입니다. AI는 돕는 도구일 뿐입니다. 순서가 바뀌면 안 됩니다!
        </div>
      </div>

      {/* Book Selection */}
      {!selectedBook ? (
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            📚 코칭할 책을 선택하세요
          </h2>
          {readingBooks.length === 0 ? (
            <div className="glass-card-static empty-state">
              <div className="empty-state-icon">📖</div>
              <div className="empty-state-title">읽고 있는 책이 없어요</div>
              <div className="empty-state-desc">서재에서 책을 "읽는 중"으로 변경해주세요</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {readingBooks.map(book => (
                <div
                  key={book.id}
                  className="glass-card"
                  style={{ padding: 'var(--space-5)', cursor: 'pointer', display: 'flex', gap: 'var(--space-4)' }}
                  onClick={() => handleSelectBook(book)}
                >
                  <div style={{
                    width: 60, height: 90, borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {book.cover ? (
                      <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BookOpen size={24} style={{ opacity: 0.3 }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{book.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{book.author}</div>
                    <div className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                      <Sparkles size={14} /> 코칭 시작
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Selected Book Info */}
          <div
            className="glass-card-static"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={20} style={{ color: 'var(--amber-400)' }} />
              <div>
                <span style={{ fontWeight: 700 }}>{selectedBook.title}</span>
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  {selectedBook.author}
                </span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSelectedBook(null); setMessages([]); setInternalizeMode(null); }}
            >
              책 변경
            </button>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator mb-6">
            {STEPS.map((step, idx) => (
              <div key={step.num} style={{ display: 'contents' }}>
                <button
                  className={`step-dot ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
                  onClick={() => startStep(step.num)}
                  title={`${step.num}단계: ${step.title} (${step.timing})`}
                >
                  {step.num}
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`step-line ${currentStep > step.num ? 'completed' : currentStep === step.num ? 'active' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {STEPS.map(step => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  className={`glass-card${isActive ? '' : '-static'} coaching-step-card`}
                  data-step={step.num}
                  style={{
                    cursor: 'pointer', textAlign: 'left',
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all var(--transition-base)',
                  }}
                  onClick={() => startStep(step.num)}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{step.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{step.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {step.subtitle}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', opacity: 0.6 }}>
                    {step.timing}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step 5 Mode Selection */}
          {currentStep === 5 && !internalizeMode && (
            <div className="glass-card-static mb-6" style={{ padding: 'var(--space-6)' }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🧠</div>
                <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>내재화 모드를 선택하세요</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                  "설명할 수 없다면, 이해한 것이 아니다" - 아인슈타인
                </p>
                {/* Learning Pyramid Mini */}
                <div style={{
                  margin: 'var(--space-4) auto', padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                  display: 'inline-flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)',
                }}>
                  <span>📖 읽기 <strong style={{ color: 'var(--rose-400)' }}>10%</strong></span>
                  <span>→</span>
                  <span>💬 토론 <strong style={{ color: 'var(--amber-400)' }}>50%</strong></span>
                  <span>→</span>
                  <span>🎤 가르치기 <strong style={{ color: 'var(--green-400)' }}>90%</strong></span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                {INTERNALIZE_MODES.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.key}
                      className="glass-card"
                      style={{
                        padding: 'var(--space-5)', cursor: 'pointer', textAlign: 'left',
                        transition: 'all var(--transition-base)',
                      }}
                      onClick={() => startInternalizeMode(mode.key)}
                    >
                      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: '1.5rem' }}>{mode.emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{mode.title}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Area */}
          {(currentStep !== 5 || internalizeMode) && (
            <div className="glass-card-static" style={{ overflow: 'hidden' }}>
              {/* Chat Header */}
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {currentStep === 5 && internalizeMode
                    ? INTERNALIZE_MODES.find(m => m.key === internalizeMode)?.emoji
                    : STEPS[currentStep - 1].emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {currentStep}단계: {STEPS[currentStep - 1].title}
                    {currentStep === 5 && internalizeMode && (
                      <span style={{ color: 'var(--amber-400)', marginLeft: 'var(--space-2)' }}>
                        — {INTERNALIZE_MODES.find(m => m.key === internalizeMode)?.title}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {currentStep === 5 && internalizeMode
                      ? INTERNALIZE_MODES.find(m => m.key === internalizeMode)?.desc
                      : STEPS[currentStep - 1].subtitle}
                  </div>
                </div>
                {currentStep === 5 && internalizeMode && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setInternalizeMode(null); setMessages([]); }}>
                    모드 변경
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="chat-container" style={{ minHeight: 300 }}>
                {messages.filter(m => m.role !== 'system').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🚀</div>
                    <div>위의 단계를 클릭하여 코칭을 시작하세요</div>
                  </div>
                ) : (
                  messages.filter(m => m.role !== 'system').map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                      <div className={`chat-avatar ${msg.role === 'user' ? 'human' : 'ai'}`}>
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className="chat-bubble" style={{ flex: 1 }}>
                        {editingMessageIdx === idx ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <textarea
                              className="textarea"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              style={{ minHeight: '150px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingMessageIdx(null)}>취소</button>
                              <button className="btn btn-primary btn-sm" onClick={() => saveEditing(idx)}>저장</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {msg.displayContent || msg.content}
                            </div>
                            <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                              {currentStep === 4 && msg.role === 'ai' && idx > 1 && editingMessageIdx !== idx && (
                                <button className="btn btn-ghost btn-sm" onClick={() => startEditing(idx, msg.content)}>
                                  <FileEdit size={14} /> 다듬기
                                </button>
                              )}
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose-400)' }} onClick={() => deleteMessage(idx)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="chat-message ai">
                    <div className="chat-avatar ai">🤖</div>
                    <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Loader size={14} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                      생각하고 있어요...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Prompts */}
              {messages.length > 0 && selectedBook && (currentStep === 1 || currentStep === 2) && (
                <div style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>💡 추천 질문 (클릭하여 입력창에 바로 붙여넣기)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {(currentStep === 1 ? [
                      `${selectedBook.author}의 '${selectedBook.title}'에서 말하는 [주요 개념]이 목차에 나오더라. 이거 핵심만 알려줘.`,
                      `${selectedBook.author}의 집필의도 알려줘.`,
                      `작가가 이 책을 집필할 당시의 사회환경과의 관련성 알려줘.`,
                      `목차 보다보니 [핵심 키워드]라는 개념이 중요하던데, 이해하기 쉬운 수준으로 알려줘.`,
                      `교보문고와 네이버 책에서 목차를 꼭 참고하고, 각종 블로그나 웹에서 검색할 수 있는 데이터들도 있으니 충분히 검색하고 참고해서 알려줘.`
                    ] : [
                      `${selectedBook.author}의 '${selectedBook.title}'에서 [     ] 내용이 이해가 안가. 책의 내용에 관련있는 범위 내에서, 쉬운 개념으로 비유들어서 설명해줘.`
                    ]).map((prompt, idx) => (
                      <button
                        key={idx}
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => setInput(prev => prev ? `${prev}\n${prompt}` : prompt)}
                        title={prompt}
                      >
                        {prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              {currentStep === 3 && !internalizeMode ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>📝 중간점검 & 노트 기록 (작성 시 서재의 기록노트에 자동 저장됩니다)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <input
                      className="input"
                      placeholder="방금 읽은 챕터명 (예: 1장. 인지 혁명)"
                      value={step3Form.chapter}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, chapter: e.target.value }))}
                      disabled={messages.length === 0}
                    />
                    <input
                      className="input"
                      placeholder="핵심 키워드 3~5개 (쉼표로 구분. 예: 허구, 협력, 신화)"
                      value={step3Form.keywords}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, keywords: e.target.value }))}
                      disabled={messages.length === 0}
                    />
                    <textarea
                      className="textarea"
                      placeholder="과감한 요약 (책을 덮고, 내 기억에 의존해서 작성해보세요!)"
                      value={step3Form.summary}
                      onChange={(e) => setStep3Form(prev => ({ ...prev, summary: e.target.value }))}
                      disabled={messages.length === 0}
                      style={{ minHeight: '60px' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleStep3Submit}
                      disabled={!step3Form.chapter.trim() || !step3Form.keywords.trim() || !step3Form.summary.trim() || isLoading || messages.length === 0}
                      style={{ marginTop: 'var(--space-2)', justifyContent: 'center' }}
                    >
                      <Sparkles size={16} /> AI 검증 및 노트에 저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="chat-input-area">
                  <textarea
                    ref={chatInputRef}
                    className="input"
                    placeholder={
                      currentStep === 4 ? "메모나 키워드를 붙여넣어 주세요..."
                      : internalizeMode === 'explain' ? "이 책의 내용을 설명해보세요..."
                      : internalizeMode === 'debate' ? "반론을 제시해보세요..."
                      : internalizeMode === 'lecture' ? "강연을 시작해보세요..."
                      : "질문이나 답변을 입력하세요..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={messages.length === 0}
                    id="coaching-input"
                    style={{ 
                      resize: 'none', 
                      minHeight: '44px', 
                      maxHeight: '200px',
                      overflowY: 'auto',
                      lineHeight: '1.5',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)'
                    }}
                  />
                  <button
                    className="btn btn-primary btn-icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || messages.length === 0}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
