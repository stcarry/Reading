import { useState } from 'react';
import {
  Map, Hammer, Link2, FilePenLine, MessageCircle, ChevronDown, ArrowRight,
  Mountain, BrickWall, Unlink, User, Bot, KeyRound, Check, Footprints, X,
  Mic, Users, Eye, Ear, BookOpen, Lightbulb, Quote,
} from 'lucide-react';

const WALLS = [
  { icon: Mountain, title: '지형을 모를 때', desc: '“이 책이 대체 어디로 가는 거야?” — 500페이지 앞의 막막함', solution: '1단계 예열로 해결 — 지도를 손에 쥐고 출발' },
  { icon: BrickWall, title: '벽에 부딪힐 때', desc: '“이 개념이 뭔 소린지 모르겠어…” — 어려운 전문 용어', solution: '2단계 몰입으로 해결 — 참지 말고 즉시 AI에게 질문' },
  { icon: Unlink, title: '맥락이 끊길 때', desc: '“앞에서 뭐라고 했더라?” — 챕터 간 연결 실패', solution: '3단계 점검으로 해결 — 점을 선으로 잇기' },
];

const STEPS_DETAIL = [
  {
    num: 1, icon: Map, title: '예열', subtitle: '구조 파악 · 지도 그리기', timing: '읽기 전',
    purpose: '큰 그림 파악 — 무작정 1페이지부터 읽지 않는다',
    details: ['책의 전체 구조와 핵심 키워드를 미리 파악', '500페이지가 3개의 핵심 챕터로 단순화', '심리적 장벽 제거 — 독서를 위한 내비게이션'],
    prompt: '유발 하라리의 \'사피엔스\'가 말하는 인류 역사의 3대 혁명이 무엇인지 핵심만 요약해줘',
    tips: ['단순 “요약해줘” 대신 구체적 키워드를 포함', '가설 검증형 질문이 AI 답변 정확도를 높임'],
  },
  {
    num: 2, icon: Hammer, title: '몰입', subtitle: '난관 돌파 · 벽 부수기', timing: '읽는 중',
    purpose: '독서 흐름(Flow) 유지 — 막히는 즉시 해결',
    details: ['모르는 개념 → 1분 안에 AI에게 비유로 설명 요청', '“나중에 찾아봐야지”는 포기의 시작', '보이스 모드로 마치 옆의 과외 선생님처럼'],
    prompt: '지금 사피엔스를 읽는데 \'푸조라는 회사는 허구다\'라는 말이 이해가 안 돼. 비유로 쉽게 설명해줘',
    tips: ['“~가 무슨 뜻이야?” 같이 편하게 질문', '보이스 모드 권장 — 타이핑보다 말이 빠름'],
  },
  {
    num: 3, icon: Link2, title: '중간점검', subtitle: '맥락 연결 · 점 잇기', timing: '챕터 후',
    purpose: '선(先) 요약, 후(後) 피드백 — Active Recall',
    details: ['책을 덮고 → 기억에만 의존해 키워드 3개 뽑기', 'AI에게 검증 요청 → 다음 챕터와 연결', '능동적 사고 시 기억 10배 강화 (과학적 입증)'],
    prompt: '농업혁명 핵심을 \'함정, 잉여 식량, 인구 폭발\'로 뽑았는데 맞아? 다음 주제와 어떻게 연결돼?',
    tips: ['챕터 끝날 때마다 5분 투자', '키워드는 3개 이하로 제한', '“다음 챕터 연결 질문” 필수'],
  },
  {
    num: 4, icon: FilePenLine, title: '정리', subtitle: '글 구조화 · 3단 구성', timing: '완독 후',
    purpose: '메모를 구조화된 글로 — 구슬을 꿰어 보배로',
    details: ['본 것 (What): 저자가 무엇을 말했는가?', '깨달은 것 (So What): 이게 나에게 왜 중요한가?', '적용할 것 (Now What): 그래서 무엇을 할 것인가?'],
    prompt: '다음 메모를 \'본 것/깨달은 것/적용할 것\' 3단 구조로 정리해줘. [메모 붙여넣기]',
    tips: ['메모 수집 → AI 초안 → 내 언어로 완성', 'AI가 쓴 초안은 반드시 내 말투로 고쳐 써야 함'],
  },
  {
    num: 5, icon: MessageCircle, title: '내재화', subtitle: '설명·토론 · 완전한 내 것', timing: '최종',
    purpose: '“설명할 수 없다면, 이해한 것이 아니다” — 기억 유지율 90%',
    details: ['구술 설명: AI에게 내가 이해한 내용을 설명', '저자 토론: AI = 저자에게 직접 질문', '반박 토론: 내 반론 → AI가 저자 입장 반박', '가상 강연: AI = 청중, 내가 강연'],
    prompt: '너는 지금부터 유발 하라리야. 내가 사피엔스에 대해 질문할게. 저자의 입장에서 대답해줘',
    tips: ['보이스 모드 필수, 완벽주의 금지', '주 1회 토론으로 장기 기억 전환', '실제 사람에게도 설명해보기'],
  },
];

const PYRAMID = [
  { label: '가르치기', icon: Mic, retention: 90, width: '34%', active: true },
  { label: '실습하기', icon: Users, retention: 75, width: '48%', active: true },
  { label: '토론하기', icon: MessageCircle, retention: 50, width: '62%', active: true },
  { label: '시범 보기', icon: Eye, retention: 30, width: '74%' },
  { label: '듣기', icon: Ear, retention: 20, width: '86%' },
  { label: '읽기', icon: BookOpen, retention: 10, width: '100%' },
];

export default function Guide() {
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <div className="page-container narrow animate-in">
      <header className="gd-hero">
        <div className="kicker mb-3">독서법 가이드</div>
        <h1 className="page-title">AI 5단계 독서법</h1>
        <p className="page-subtitle">김익환 교수의 ‘AI로 떠먹여주는 독서법’ — 완독과 깊은 이해를 위한 체계적인 여정</p>
      </header>

      {/* 핵심 원칙 */}
      <section className="card gd-principle">
        <div className="gd-principle-icon"><KeyRound size={22} /></div>
        <h2>AI는 도구, 나는 주체</h2>
        <div className="gd-duo">
          <div className="gd-duo-card">
            <h4><User size={16} /> 인간</h4>
            <p>질문 &amp; 판단<br />키워드 선정<br />최종 내재화</p>
          </div>
          <ArrowRight size={20} className="gd-duo-arrow" />
          <div className="gd-duo-card">
            <h4><Bot size={16} /> AI</h4>
            <p>구조 시각화<br />난관 돌파<br />초안 작성</p>
          </div>
        </div>
        <p className="gd-quote">“생각의 주체는 여러분입니다. AI는 돕는 도구일 뿐입니다. 순서가 바뀌면 안 됩니다.”</p>
      </section>

      {/* 3개의 벽 */}
      <div className="section-head"><h2>독서를 가로막는 3개의 벽</h2></div>
      <div className="gd-grid-3">
        {WALLS.map((wall, i) => {
          const Icon = wall.icon;
          return (
            <div key={i} className="card gd-wall">
              <div className="list-icon"><Icon size={18} /></div>
              <h4>{wall.title}</h4>
              <p>{wall.desc}</p>
              <div className="solution"><Check size={14} /> {wall.solution}</div>
            </div>
          );
        })}
      </div>

      {/* 페이스메이커 */}
      <div className="section-head"><h2>AI 독서의 본질: 페이스메이커</h2></div>
      <section className="card text-center">
        <p className="t-subhead c-2" style={{ maxWidth: 520, margin: '0 auto' }}>
          혼자 달리면 중도 포기하기 쉽지만, AI 페이스메이커와 함께하면 지치지 않고 끝까지 완주(완독)할 수 있습니다.
        </p>
        <div className="gd-pace">
          <div>
            <div className="list-icon neutral"><X size={18} /></div>
            <b>혼자 달리기</b>
            <small>쉽게 지치고 포기</small>
          </div>
          <ArrowRight size={18} className="c-3" />
          <div>
            <div className="list-icon"><Footprints size={18} /></div>
            <b>AI와 함께</b>
            <small>끝까지 완주</small>
          </div>
        </div>
      </section>

      {/* 5단계 */}
      <div className="section-head"><h2>5단계 전체 프로세스</h2><span className="meta">항목을 눌러 자세히 보기</span></div>
      <div>
        {STEPS_DETAIL.map((step) => {
          const isExpanded = expandedStep === step.num;
          const Icon = step.icon;
          return (
            <div key={step.num} className={`disclosure ${isExpanded ? 'open' : ''}`}>
              <button className="disclosure-head" onClick={() => setExpandedStep(isExpanded ? null : step.num)} aria-expanded={isExpanded}>
                <div className="gd-step-badge">{step.num}</div>
                <div className="disclosure-title">
                  <div className="flex items-center gap-2"><Icon size={15} className="c-accent" /> {step.title} <span className="c-3" style={{ fontWeight: 400 }}>— {step.subtitle}</span></div>
                  <div className="disclosure-sub">{step.purpose}</div>
                </div>
                <span className="tag tag-accent">{step.timing}</span>
                <ChevronDown size={18} className="disclosure-chevron" />
              </button>
              {isExpanded && (
                <div className="disclosure-body gd-step-detail">
                  <div>
                    <h5>핵심 활동</h5>
                    <ul>{step.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div>
                    <h5><Quote size={12} style={{ display: 'inline', verticalAlign: -1 }} /> 예시 프롬프트</h5>
                    <div className="gd-prompt">“{step.prompt}”</div>
                  </div>
                  <div>
                    <h5><Lightbulb size={12} style={{ display: 'inline', verticalAlign: -1 }} /> 팁</h5>
                    <div className="gd-tips">{step.tips.map((tip, i) => <div key={i}>· {tip}</div>)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 학습 피라미드 */}
      <div className="section-head"><h2>학습 피라미드 — 기억 유지율</h2></div>
      <section className="card">
        <p className="t-footnote c-2 text-center mb-4">“설명할 수 없다면, 이해한 것이 아니다” — 아인슈타인</p>
        <div className="pyramid">
          {PYRAMID.map(level => {
            const Icon = level.icon;
            return (
              <div key={level.label} className={`pyramid-row ${level.active ? '' : 'passive'}`} style={{ width: level.width }}>
                <span><Icon size={14} /> {level.label}</span>
                <b>{level.retention}%</b>
              </div>
            );
          })}
        </div>
        <div className="pyramid-foot">
          <span>위 — 능동적 학습 (가르치기·토론)</span>
          <span>아래 — 수동적 학습 (읽기·듣기)</span>
        </div>
      </section>

      {/* 총정리 */}
      <div className="section-head"><h2>5단계 총정리</h2></div>
      <section className="card pad-0">
        <div style={{ overflowX: 'auto' }}>
          <table className="gd-table">
            <thead>
              <tr><th>단계</th><th>시점</th><th>핵심 활동</th><th>핵심 원칙</th></tr>
            </thead>
            <tbody>
              {STEPS_DETAIL.map(step => (
                <tr key={step.num}>
                  <td>{step.num}. {step.title}</td>
                  <td>{step.timing}</td>
                  <td>{step.subtitle}</td>
                  <td>{step.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-footnote c-2 text-center" style={{ padding: 'var(--s-4) var(--s-5)' }}>
          이 5단계를 거치면 단순한 독서(Reading)가 학습(Learning)과 내재화(Internalization)로 진화합니다.
        </p>
      </section>
    </div>
  );
}
