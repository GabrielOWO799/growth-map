// src/config.js
// 运行模式开关。
// VITE_DEMO_MODE=true 时（当前 .env.production 已开启）：跳过登录/注册，
// 数据层走 localStorage（见 localBackend.js），线上 Vercel 站点变成可交互的演示。
// 等后端（Railway）修好并配置 SECRET_KEY 后，把这行改成 false 即可恢复真实登录。
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
