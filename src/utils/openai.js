export const callOpenAI = async (messages, model = 'gpt-4o') => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  const isO1 = model.startsWith('o1') || model.startsWith('o3');

  // 매핑: 우리의 'ai' 역할을 openai의 'assistant'로 변환
  // o1 계열은 system 역할 호환성이 다를 수 있으므로 필요시 developer로 변환 (최신 API 기준)
  const formattedMessages = messages.map(m => {
    let role = m.role === 'ai' ? 'assistant' : m.role;
    if (isO1 && role === 'system') role = 'developer';
    return { role, content: m.content };
  });

  const body = {
    model: model,
    messages: formattedMessages,
  };

  // o1 모델은 보통 temperature를 지원하지 않음
  if (!isO1) {
    body.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API 호출 에러: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
