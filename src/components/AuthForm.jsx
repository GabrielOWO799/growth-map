// src/components/AuthForm.jsx
// 登录 / 注册 界面（Step 2）
// 未登录时由 App 渲染；登录/注册成功后通过 useAuth 自动切换主界面。

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './AuthForm.css';

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (username.trim().length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      // 成功：useAuth 状态变化，App 会自动渲染主界面
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🌱</div>
        <h1 className="auth-title">成长图谱</h1>
        <p className="auth-subtitle">
          {isLogin ? '登录后同步你的成就数据' : '注册一个新账号，开启成长记录'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">用户名</label>
          <input
            className="auth-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-20 个字符"
            autoComplete="username"
          />

          <label className="auth-label">密码</label>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 个字符"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '⏳ 处理中…' : isLogin ? '🔑 登录' : '✨ 注册并登录'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? '还没有账号？' : '已有账号？'}{' '}
          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {isLogin ? '去注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
