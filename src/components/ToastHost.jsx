// src/components/ToastHost.jsx
// 全局 Toast 渲染器：挂载一次（App.jsx），监听 gm:toast 事件，自动消失。
import { useState, useEffect } from 'react';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const item = e.detail;
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 2600);
    };
    window.addEventListener('gm:toast', onToast);
    return () => window.removeEventListener('gm:toast', onToast);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
