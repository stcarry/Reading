import { useState } from 'react';
import {
  Map, Hammer, Link2, FileEdit, MessageCircle,
  BookOpen, Brain, AlertCircle, ChevronDown, ChevronUp,
  Mic, Users, Swords, GraduationCap, Lightbulb, Target
} from 'lucide-react';

const WALLS = [
  { emoji: '🏔', title: '지형을 모를 때', desc: '"이 책이 대체 어디로 가는 거야?" (500페이지 앞 막막함)', solution: '1단계 예열로 해결 — 지도를 손에 쥐고 출발', color: 'teal' },
  { emoji: '🧱', title: '벽에 부딪힐 때', desc: '"이 개념이 뭔 소린지 모르겠어..." (어려운 전문 용어)', solution: '2단계 몰입으로 해결 — 참지 말고 즉시 AI에게 질문', color: 'amber' },
  { emoji: '🔗', title: '맥락이 끊길 때', desc: '"앞에서 뭐라고 했더라?" (챕터 간 연결 실패)', solution: '3단계 점검으로 해결 — 점을 선으로 잇기', color: 'violet' },
];

const STEPS_DETAIL = [
  {
    num: 1, emoji: '🗺', title: '예열', subtitle: '구조 파악 (지도 그리기)',
    timing: '읽기 전', color: 'teal',
    purpose: '큰 그림 파악 — 무작정 1페이지부터 읽지 않는다',
    details: [
      '책의 전체 구조와 핵심 키워드를 미리 파악',
      '500페이지가 3개의 핵심 챕터로 단순화',
      '심리적 장벽 제거 — 독서를 위한 네비게이션',
    ],
    prompt: '"유발 하라리의 \'사피엔스\'가 말하는 인류 역사의 3대 혁명이 무엇인지 핵심만 요약해줘"',
    tips: ['단순 "요약해줘" 대신 구체적 키워드를 포함', '가설 검증형 질문이 AI 답변 정확도를 높임'],
  },
  {
    num: 2, emoji: '🔨', title: '몰입', subtitle: '난관 돌파 (벽 부수기)',
    timing: '읽는 중', color: 'amber',
    purpose: '독서 흐름(Flow) 유지 — 막히는 즉시 해결',
    details: [
      '모르는 개념 → 1분 안에 AI에게 비유로 설명 요청',
      '"나중에 찾아봐야지"는 포기의 시작',
      'ChatGPT 보이스 모드로 마치 옆의 과외 선생님처럼',
    ],
    prompt: '"지금 사피엔스를 읽는데 \'푸조라는 회사는 허구다\'라는 말이 이해가 안 돼. 비유로 쉽게 설명해줘"',
    tips: ['"~가 무슨 뜻이야?" 같이 편하게 질문', '보이스 모드 권장 — 타이핑보다 말이 빠름'],
  },
  {
    num: 3, emoji: '🔗', title: '중간점검', subtitle: '맥락 연결 (점 잇기)',
    timing: '챕터 후', color: 'violet',
    purpose: '선(先) 요약, 후(後) 피드백 — Active Recall',
    details: [
      '📕 책을 덮고 → 🧠 기억에만 의존해 키워드 3개 뽑기',
      'AI에게 검증 요청 → 다음 챕터와 연결',
      '능동적 사고 시 기억 10배 강화 (과학적 입증)',
    ],
    prompt: '"농업혁명 핵심을 \'함정, 잉여 식량, 인구 폭발\'로 뽑았는데 맞아? 다음 주제와 어떻게 연결돼?"',
    tips: ['챕터 끝날 때마다 5분 투자', '키워드는 3개 이하로 제한', '"다음 챕터 연결 질문" 필수'],
  },
  {
    num: 4, emoji: '✏️', title: '정리', subtitle: '글 구조화 (3단 구성)',
    timing: '완독 후', color: 'rose',
    purpose: '메모를 구조화된 글로 — 구슬을 꿰어 보배로',
    details: [
      '📝 본 것 (What): 저자가 무엇을 말했는가?',
      '💡 깨달은 것 (So What): 이게 나에게 왜 중요한가?',
      '🎯 적용할 것 (Now What): 그래서 무엇을 할 것인가?',
    ],
    prompt: '"다음 메모를 \'본 것/깨달은 것/적용할 것\' 3단 구조로 정리해줘. [메모 붙여넣기]"',
    tips: ['메모 수집 → AI 초안 → 내 언어로 완성', '⚠️ AI가 쓴 초안은 반드시 내 말투로 고쳐 써야 함'],
  },
  {
    num: 5, emoji: '💬', title: '내재화', subtitle: '설명·토론 (완전한 내 것)',
    timing: '최종', color: 'green',
    purpose: '"설명할 수 없다면, 이해한 것이 아니다" — 기억 유지율 90%',
    details: [
      '🎤 구술 설명: AI에게 내가 이해한 내용을 설명',
      '💬 저자 토론: AI = 저자에게 직접 질문',
      '🥊 반박 토론: 내 반론 → AI가 저자 입장 반박',
      '🎓 가상 강연: AI = 청중, 내가 강연',
    ],
    prompt: '"너는 지금부터 유발 하라리야. 내가 사피엔스에 대해 질문할게. 저자의 입장에서 대답해줘"',
    tips: ['보이스 모드 필수, 완벽주의 금지', '주 1회 토론으로 장기 기억 전환', '실물에게도 설명해보기'],
  },
];

const PYRAMID_LEVELS = [
  { label: '가르치기', retention: 90, color: 'var(--green-400)', width: '30%' },
  { label: '실습하기', retention: 75, color: 'var(--teal-400)', width: '45%' },
  { label: '토론하기', retention: 50, color: 'var(--amber-400)', width: '60%' },
  { label: '시범 보기', retention: 30, color: 'var(--rose-400)', width: '72%' },
  { label: '듣기', retention: 20, color: 'var(--violet-400)', width: '84%' },
  { label: '읽기', retention: 10, color: 'var(--text-tertiary)', width: '100%' },
];

export default function Guide() {
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">AI 5단계 독서법 가이드 📖</h1>
        <p className="page-subtitle">
          김익환 교수의 'AI로 떠먹여주는 독서법' — 완독과 깊은 이해를 위한 체계적인 여정
        </p>
      </div>

      {/* Core Principle */}
      <div className="glass-card-static mb-6" style={{
        padding: 'var(--space-6)', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(20,184,166,0.04))',
        border: '1px solid rgba(245,158,11,0.15)',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔑</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--amber-400)', marginBottom: 'var(--space-3)' }}>
          핵심 원칙: AI는 도구, 나는 주체
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-4)', maxWidth: 500, margin: '0 auto', alignItems: 'center' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>🧑 인간</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              질문 & 판단<br />키워드 선정<br />최종 내재화
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xl)', color: 'var(--amber-400)' }}>→</div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>🤖 AI</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              구조 시각화<br />난관 돌파<br />초안 작성
            </div>
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-4)', fontStyle: 'italic' }}>
          "생각의 주체는 여러분입니다. AI는 돕는 도구일 뿐입니다. 순서가 바뀌면 안 됩니다!"
        </div>
      </div>

      {/* 3 Walls */}
      <div className="mb-6">
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
          🚧 독서를 가로막는 3개의 벽
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          {WALLS.map((wall, i) => (
            <div key={i} className="glass-card-static" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{wall.emoji}</div>
              <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>{wall.title}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
                {wall.desc}
              </div>
              <div style={{
                fontSize: 'var(--text-xs)', color: `var(--${wall.color}-400)`, fontWeight: 600,
                padding: 'var(--space-2) var(--space-3)', background: `rgba(var(--${wall.color}-rgb, 0), 0.05)`,
                borderRadius: 'var(--radius-sm)',
              }}>
                ✅ {wall.solution}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Pacemaker */}
      <div className="glass-card-static mb-6" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          🏃‍♂️ AI 독서의 본질: 페이스메이커
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', maxWidth: 600, margin: '0 auto var(--space-4)' }}>
          혼자 달리면 중도 포기하기 쉽지만, AI 페이스메이커와 함께하면 지치지 않고 끝까지 완주(완독)할 수 있습니다.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.5rem' }}>❌</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>혼자 달리기</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>쉽게 지치고 포기</div>
          </div>
          <div style={{ fontSize: '1.5rem', alignSelf: 'center' }}>→</div>
          <div>
            <div style={{ fontSize: '1.5rem' }}>✅</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px', color: 'var(--green-400)' }}>AI와 함께</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>끝까지 완주!</div>
          </div>
        </div>
      </div>

      {/* 5 Steps Detail */}
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
        🔄 AI 5단계 독서법 전체 프로세스
      </h2>

      {/* Timeline */}
      <div className="flex flex-col gap-4 mb-6 stagger-children">
        {STEPS_DETAIL.map((step) => {
          const isExpanded = expandedStep === step.num;
          return (
            <div
              key={step.num}
              className="glass-card-static"
              style={{
                cursor: 'pointer',
                border: isExpanded ? `1px solid var(--${step.color}-400)` : undefined,
                transition: 'all var(--transition-base)',
              }}
              onClick={() => setExpandedStep(isExpanded ? null : step.num)}
            >
              <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `var(--${step.color}-400)`, color: 'var(--bg-primary)', fontWeight: 800, fontSize: 'var(--text-lg)',
                  flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {step.emoji} {step.title} — {step.subtitle}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {step.purpose}
                  </div>
                </div>
                <span className="tag" style={{ background: `rgba(var(--${step.color}-rgb, 0), 0.1)`, color: `var(--${step.color}-400)`, flexShrink: 0 }}>
                  {step.timing}
                </span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {isExpanded && (
                <div style={{
                  padding: '0 var(--space-5) var(--space-5)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 'var(--space-4)',
                }}>
                  {/* Details */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>핵심 활동:</div>
                    <ul style={{ paddingLeft: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 2 }}>
                      {step.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  {/* Prompt Example */}
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)',
                    borderLeft: `3px solid var(--${step.color}-400)`,
                  }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: `var(--${step.color}-400)`, marginBottom: '4px' }}>
                      💬 예시 프롬프트:
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {step.prompt}
                    </div>
                  </div>
                  {/* Tips */}
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>💎 팁:</div>
                    {step.tips.map((tip, i) => (
                      <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                        • {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Learning Pyramid */}
      <div className="glass-card-static mb-6" style={{ padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)', textAlign: 'center' }}>
          🗣 학습 피라미드 — 기억 유지율
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          "설명할 수 없다면, 이해한 것이 아니다" - 아인슈타인
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          {PYRAMID_LEVELS.map((level, i) => (
            <div key={i} style={{
              width: level.width, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-2) var(--space-4)',
              background: `${level.color}15`, borderRadius: 'var(--radius-sm)',
              border: `1px solid ${level.color}30`,
              minWidth: 180,
            }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{level.label}</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: level.color }}>{level.retention}%</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          ▲ 능동적 학습 (가르치기/토론) | ▼ 수동적 학습 (읽기/듣기)
        </div>
      </div>

      {/* Summary Table */}
      <div className="glass-card-static" style={{ padding: 'var(--space-6)', overflow: 'auto' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
          🏆 전체 5단계 총정리
        </h2>
        <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
              {['단계', '시점', '핵심 활동', '핵심 원칙'].map(h => (
                <th key={h} style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STEPS_DETAIL.map(step => (
              <tr key={step.num} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 700 }}>{step.emoji} {step.title}</td>
                <td style={{ padding: 'var(--space-3)', color: 'var(--text-tertiary)' }}>{step.timing}</td>
                <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>{step.subtitle}</td>
                <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{step.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          이 5단계를 거치면 단순한 독서(Reading)가 학습(Learning)과 내재화(Internalization)로 진화합니다.
        </div>
      </div>
    </div>
  );
}
