import 'dotenv/config';

async function testOpenAI() {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  console.log("Testing with API Key ending in:", apiKey.slice(-4));
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error("API Error Response:", err);
    } else {
      const data = await res.json();
      console.log("API Success:", data.choices[0].message.content);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testOpenAI();
