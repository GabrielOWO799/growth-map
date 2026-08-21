// src/api.jsx
// 前端与后端的唯一通信层（Step 2：接通后端 API + 登录态）
//
// 关键约定（与 backend/main.py、backend/auth.py 对齐）：
//   1. 鉴权用 JWT Bearer：请求头 `Authorization: Bearer <token>`
//   2. 登录 `/login` 走 OAuth2 密码流 => 必须用 form 表单（application/x-www-form-urlencoded），不是 JSON
//   3. 注册 `/register` 用 JSON { username, password }
//   4. 成就 CRUD 全部需要 Bearer；字段名是 category / target_value / current_value / due_date / created_at
//      （前端的 tag / imageUrl / date 在 useAchievements 里做映射，这里只负责透传）
//
// 注意：没有用 axios（项目未安装），改用原生 fetch，零依赖、可避免 import 崩溃。

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'gm_token';

// ---- token 存取（与 AuthContext 共用同一 key） ----
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---- 底层请求封装 ----
async function request(method, path, body, { isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload;
  if (body !== undefined) {
    if (isForm) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = body; // 期望传入 URLSearchParams
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });

  // 401：token 失效/未登录 -> 清掉本地 token 并广播事件，让 AuthContext 退出登录
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('gm:unauthorized'));
    throw new Error('登录已过期，请重新登录');
  }

  // 尝试解析响应体（后端异常处理器返回 { code, message, success }）
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg = data && data.message ? data.message : `请求失败 (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---------- 认证 ----------
export async function register({ username, password }) {
  // 后端返回 { id, username }
  return request('POST', '/register', { username, password });
}

export async function login({ username, password }) {
  // 后端要求 form 表单（OAuth2PasswordRequestForm）
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const data = await request('POST', '/login', form, { isForm: true });
  if (data && data.access_token) setToken(data.access_token);
  return data; // { access_token, token_type }
}

// ---------- 成就 CRUD ----------
export async function fetchAchievements(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  const query = qs.toString();
  return request('GET', `/achievements${query ? `?${query}` : ''}`);
}

export async function createAchievement(payload) {
  return request('POST', '/achievements', payload);
}

export async function updateAchievement(id, payload) {
  return request('PUT', `/achievements/${id}`, payload);
}

export async function deleteAchievement(id) {
  return request('DELETE', `/achievements/${id}`);
}

// 进度更新（Step 3）：只传 current_value 这一个字段，复用 PUT 接口做局部更新
// 后端 update_achievement 用了 exclude_unset=True，所以只更新传进来的字段，不动其他字段。
export async function updateProgress(id, currentValue) {
  return request('PUT', `/achievements/${id}`, { current_value: currentValue });
}

// ---------- 统计（后端已实现，前端目前本地计算，预留接口） ----------
export async function fetchStatsByCategory() {
  return request('GET', '/achievements/stats/by_category');
}

export async function fetchOverallStats() {
  return request('GET', '/achievements/stats/overall');
}
