import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Toast from './components/Toast';

// Suprimir erro do ResizeObserver (não é crítico, apenas um warning)
// Este erro ocorre quando o ResizeObserver detecta mudanças de tamanho muito rápidas
// É um problema conhecido com bibliotecas de gráficos e componentes que redimensionam
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0];
  if (
    (typeof errorMessage === 'string' &&
      (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
       errorMessage.includes('ResizeObserver loop limit exceeded'))) ||
    (errorMessage?.message &&
      (errorMessage.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       errorMessage.message.includes('ResizeObserver loop limit exceeded')))
  ) {
    return; // Suprimir este erro específico
  }
  originalError.apply(console, args);
};

// Suprimir erro do ResizeObserver no window.onerror também
const originalErrorHandler = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (
    typeof message === 'string' &&
    (message.includes('ResizeObserver loop completed with undelivered notifications') ||
     message.includes('ResizeObserver loop limit exceeded'))
  ) {
    return true; // Prevenir que o erro seja exibido
  }
  if (originalErrorHandler) {
    return originalErrorHandler(message, source, lineno, colno, error);
  }
  return false;
};

// Suprimir também no unhandledrejection (caso seja uma Promise rejeitada)
window.addEventListener('unhandledrejection', (e) => {
  if (
    e.reason &&
    typeof e.reason === 'string' &&
    (e.reason.includes('ResizeObserver loop completed with undelivered notifications') ||
     e.reason.includes('ResizeObserver loop limit exceeded'))
  ) {
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toast />
  </React.StrictMode>
);
