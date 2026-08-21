// src/auth/AuthContext.jsx
// 登录态全局管理（Step 2）
//
// 设计说明：
//   - token 存 localStorage（key: gm_token），刷新页面后仍能保持登录
//   - 后端没有 /me 之类的“取当前用户”接口，username 直接从 JWT 的 payload.sub 解码得到
//     （只是用于界面展示，无需后端交互）
//   - 任何 API 返回 401 时，api.jsx 会广播 'gm:unauthorized' 事件，这里监听后自动登出
//
// 用法：在 src/main.jsx 用 <AuthProvider> 包裹 <App/>，业务组件里用 useAuth() 取状态。

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'gm_token';

// 不引入 jwt 库，手动解码 payload 里的 sub（仅展示用，不做签名校验）
function decodeSub(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json).sub || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // 初始状态直接读 localStorage，避免已登录用户看到登录页闪一下
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState(() => decodeSub(localStorage.getItem(TOKEN_KEY)));

  const setSession = useCallback((t) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setTokenState(t);
      setUsername(decodeSub(t));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUsername(null);
    }
  }, []);

  const login = useCallback(
    async (usernameVal, password) => {
      const data = await api.login({ username: usernameVal, password });
      setSession(data.access_token);
      return data;
    },
    [setSession]
  );

  const register = useCallback(
    async (usernameVal, password) => {
      await api.register({ username: usernameVal, password });
      // 注册成功后端不返回 token，自动登录一次拿到 token
      const data = await api.login({ username: usernameVal, password });
      setSession(data.access_token);
      return data;
    },
    [setSession]
  );

  const logout = useCallback(() => setSession(null), [setSession]);

  // 监听全局 401（token 过期），自动登出
  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener('gm:unauthorized', onUnauthorized);
    return () => window.removeEventListener('gm:unauthorized', onUnauthorized);
  }, [setSession]);

  const value = {
    token,
    username,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 业务组件统一通过 useAuth() 取登录态
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 <AuthProvider> 内部使用');
  return ctx;
}
