// 导入 polyfills 和样式
import './polyfills';
import './index.css';
// import './i18n'; // 暂时注释掉，避免 react-i18next 的 React 依赖问题

// 导入依赖
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import App from './App';

// 导入 React 相关库
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 隐藏 React DevTools 提示
if (process.env.NODE_ENV === 'development') {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };
}

// 检查是否在移动端环境
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 移动端兼容性检查和错误处理
const handleRuntimeError = () => {
  // 全局错误处理
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('runtime')) {
      console.warn('检测到runtime相关错误，可能是浏览器扩展或移动端兼容性问题:', event.error);
      // 不阻止默认行为，让应用继续运行
      return false;
    }
  });
  
  // 未捕获的Promise错误处理
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('runtime')) {
      console.warn('检测到未处理的runtime相关Promise错误:', event.reason);
      event.preventDefault(); // 阻止默认的错误处理
    }
  });
};

// 在应用启动前执行兼容性检查
handleRuntimeError();

// 微前端生命周期
let root = null;

function mount() {
  const container = document.getElementById('root');
  if (!container) return;
  
  root = ReactDOM.createRoot(container);
  root.render(
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  );
}

function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

// 判断是否在微前端环境中
if (window.__MICRO_APP_ENVIRONMENT__) {
  // 暴露生命周期钩子
  window[`micro-app-meeting-room`] = { mount, unmount };
} else {
  // 独立运行时直接挂载
  mount();
}

export { mount, unmount };

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA

// 移动端兼容性：在移动端禁用Service Worker以避免潜在问题
if (isMobile) {
  serviceWorkerRegistration.unregister();
} else {
  serviceWorkerRegistration.unregister();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
