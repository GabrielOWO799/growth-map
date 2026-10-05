// src/toast.js
// 轻量全局通知：任何模块 import { toast } 即可弹出提示，替代 alert()。
// ToastHost 组件挂在 App 里监听并渲染，2.6 秒自动消失。
export function toast(message, type = 'info') {
  window.dispatchEvent(
    new CustomEvent('gm:toast', {
      detail: { message, type, id: Date.now() + Math.random() },
    })
  );
}
