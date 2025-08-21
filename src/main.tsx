import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import TestAI from "./TestAI";
import TestPush from "./TestPush";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TestAI />
    <TestPush />
  </StrictMode>
);