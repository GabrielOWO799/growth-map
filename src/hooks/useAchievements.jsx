// src/hooks/useAchievements.jsx
// 成就数据层（Step 2：改为 API 单一数据源）
//
// 改动要点（对照旧版 localStorage 实现）：
//   1. 数据全部来自后端 /achievements，不再读写 localStorage —— 彻底消除“双数据层割裂”
//   2. 登录态由 useAuth() 驱动：登录后自动拉取，登出后清空
//   3. 前端字段(tag/imageUrl/date) 与后端字段(category/target_value/...) 在此做映射
//
// ⚠️ 已知 schema 说明：
//   - 后端暂无 image_url 列，imageUrl 暂用默认图占位（后端补列后回填）
//   - target_value/current_value/due_date 后端已支持；current_value 现已在前端编辑弹窗收集

import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&auto=format';

// 后端 -> 前端
function toFrontend(db) {
  return {
    id: db.id,
    title: db.title,
    description: db.description ?? '',
    tag: db.category ?? '学习',
    imageUrl: DEFAULT_IMAGE, // 后端暂无 image_url 列，暂用默认图占位
    date: db.created_at,
    createdAt: db.created_at,
    // 进度/目标模型（后端已有，前端在编辑弹窗里直接接 currentValue）
    targetValue: db.target_value,
    currentValue: db.current_value,
    dueDate: db.due_date,
  };
}

// 前端 -> 后端（新增/整体更新用）
function toBackend(fe) {
  return {
    title: fe.title,
    description: fe.description ?? null,
    category: fe.tag, // 前端 tag 映射到后端 category
    target_value: 1,
    current_value: 0,
    due_date: null,
  };
}

function useAchievements() {
  const { isAuthenticated } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // syncState: idle | syncing | synced | error（替代旧的 storageInfo）
  const [syncState, setSyncState] = useState('idle');

  // 拉取列表
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSyncState('syncing');
    try {
      const list = await api.fetchAchievements();
      setAchievements((list || []).map(toFrontend));
      setSyncState('synced');
    } catch (e) {
      setError(e.message);
      setSyncState('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登录态变化：登录后拉取，登出后清空
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setAchievements([]);
      setSyncState('idle');
    }
  }, [isAuthenticated, loadData]);

  // 新增
  const addAchievement = useCallback(async (fe) => {
    const created = await api.createAchievement(toBackend(fe));
    const mapped = toFrontend(created);
    setAchievements((prev) => [mapped, ...prev]);
    return mapped.id;
  }, []);

  // 更新
  const updateAchievement = useCallback(async (id, edits) => {
    const updated = await api.updateAchievement(id, toBackend(edits));
    const mapped = toFrontend(updated);
    setAchievements((prev) => prev.map((a) => (a.id === id ? mapped : a)));
    return true;
  }, []);

  // 进度更新（Step 3）：只改 current_value，不碰其他字段
  // 学习点：后端 PUT 接口是“只更新传入字段”，所以这里直接传给 api.updateProgress 即可。
  const updateProgress = useCallback(async (id, currentValue) => {
    const updated = await api.updateProgress(id, currentValue);
    const mapped = toFrontend(updated);
    setAchievements((prev) => prev.map((a) => (a.id === id ? mapped : a)));
    return true;
  }, []);

  // 删除
  const deleteAchievement = useCallback(async (id) => {
    await api.deleteAchievement(id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  // 清空（逐个删除，因为后端没有“清空全部”接口）
  const clearAllAchievements = useCallback(async () => {
    const ids = achievements.map((a) => a.id);
    await Promise.all(ids.map((id) => api.deleteAchievement(id).catch(() => {})));
    setAchievements([]);
    return true;
  }, [achievements]);

  // 统计（前端本地计算，inputs 仍是 tag/createdAt）
  const getStatistics = useCallback(() => {
    const total = achievements.length;
    const byTag = {};
    achievements.forEach((a) => {
      byTag[a.tag] = (byTag[a.tag] || 0) + 1;
    });
    const last7Days = {};
    const now = new Date();
    achievements.forEach((a) => {
      const date = new Date(a.createdAt || a.date);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) last7Days[diffDays] = (last7Days[diffDays] || 0) + 1;
    });
    return { total, byTag, last7Days };
  }, [achievements]);

  // 导出当前列表为 JSON
  const exportData = useCallback(
    () =>
      JSON.stringify(
        {
          achievements,
          exportDate: new Date().toISOString(),
          version: '1.0',
          count: achievements.length,
        },
        null,
        2
      ),
    [achievements]
  );

  // 从 JSON 导入（逐条创建）
  const importData = useCallback(async (jsonData) => {
    const data = JSON.parse(jsonData);
    if (!data.achievements || !Array.isArray(data.achievements)) {
      throw new Error('数据格式错误：缺少 achievements 数组');
    }
    const valid = data.achievements.filter((i) => i && typeof i === 'object' && i.title);
    for (const item of valid) {
      const created = await api.createAchievement(toBackend(item));
      setAchievements((prev) => [toFrontend(created), ...prev]);
    }
    return valid.length;
  }, []);

  return {
    achievements,
    isLoading,
    error,
    syncState,
    addAchievement,
    deleteAchievement,
    updateAchievement,
    updateProgress,
    clearAllAchievements,
    getStatistics,
    exportData,
    importData,
    reload: loadData,
  };
}

export default useAchievements;
