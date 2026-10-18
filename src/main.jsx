import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// GitHub Pages(/Reading/) 배포와 로컬 개발 모두에서 동일하게 동작하도록 base를 라우터에 전달
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

// 404.html → index.html 리다이렉트 복원 (SPA 딥링크 지원)
const redirected = sessionStorage.getItem('rg:redirect');
if (redirected) {
  sessionStorage.removeItem('rg:redirect');
  window.history.replaceState(null, '', redirected);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={BASENAME}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(err => {
      console.log('SW registration failed:', err);
    });
  });
}
