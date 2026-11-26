import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_FULL_TITLE } from './version';

// 창 제목(설치 앱 제목 표시줄 포함)은 항상 version.ts 의 버전으로 표시
document.title = APP_FULL_TITLE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
