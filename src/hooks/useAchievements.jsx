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
import * as localBackend from '../localBackend';
import { IS_DEMO_MODE } from '../config';
import { useAuth } from '../auth/AuthContext';

// 数据层二选一：演示模式走 localStorage，否则走真实后端（两者函数签名一致）
const backend = IS_DEMO_MODE ? localBackend : api;

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&auto=format';

// 后端 -> 前端
function toFrontend(db) {
  return {
    id: db.id,
    title: db.title,
    description: db.description ?? '',
    tag: db.category ?? '学习',
    // 技能树字段：kind=card/milestone/task，parentId/rootId 构成森林
    kind: db.kind ?? 'card',
    parentId: db.parent_id ?? null,
    rootId: db.root_id ?? null,
    imageUrl: db.image_url || DEFAULT_IMAGE,
    date: db.created_at,
    createdAt: db.created_at,
    // 进度/目标模型（后端已有，前端在编辑弹窗里直接接 currentValue）
    targetValue: db.target_value,
    currentValue: db.current_value,
    dueDate: db.due_date,
    difficulty: db.difficulty ?? null,
  };
}

// 前端 -> 后端（仅用于新增：未提供的字段用合理默认值）
// 注意：导入的数据带有 targetValue/currentValue/dueDate，这里要带上，否则导入会丢目标值
function toBackend(fe) {
  const target = fe.targetValue ?? 1;
  return {
    title: fe.title,
    description: fe.description ?? null,
    category: fe.tag ?? '学习',
    target_value: target,
    // 旧编辑bug可能留下 current > target 的脏数据，导入时钳到 target，避免整单撞后端 422
    current_value: Math.min(fe.currentValue ?? 0, target),
    due_date: fe.dueDate ?? null,
    kind: fe.kind ?? 'card',
    parent_id: fe.parentId ?? null,
    // 默认占位图不落库，保持 null，让展示层自己回落
    image_url: fe.imageUrl && fe.imageUrl !== DEFAULT_IMAGE ? fe.imageUrl : null,
    difficulty: fe.difficulty ?? null,
  };
}

// 前端 -> 后端（更新用：只映射传入的字段）
// 后端 PUT 用 exclude_unset=True 只更新传进来的字段，
// 所以更新时严禁像新增那样给 target_value/current_value/due_date 填默认值——
// 那会把用户已有的目标值、进度、截止日期静默重置（曾踩过的坑）。
function toBackendPatch(fe) {
  const patch = {};
  if (fe.title !== undefined) patch.title = fe.title;
  if (fe.description !== undefined) patch.description = fe.description ?? null;
  if (fe.tag !== undefined) patch.category = fe.tag;
  if (fe.currentValue !== undefined) patch.current_value = fe.currentValue;
  if (fe.targetValue !== undefined) patch.target_value = fe.targetValue;
  if (fe.dueDate !== undefined) patch.due_date = fe.dueDate;
  if (fe.parentId !== undefined) patch.parent_id = fe.parentId;
  if (fe.imageUrl !== undefined) patch.image_url = fe.imageUrl || null;
  if (fe.difficulty !== undefined) patch.difficulty = fe.difficulty || null;
  return patch;
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
      const list = await backend.fetchAchievements();
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
    const created = await backend.createAchievement(toBackend(fe));
    const mapped = toFrontend(created);
    setAchievements((prev) => [mapped, ...prev]);
    return mapped.id;
  }, []);

  // 更新（局部：只传变化的字段，后端 exclude_unset=True 不会动其他字段）
  const updateAchievement = useCallback(async (id, edits) => {
    const updated = await backend.updateAchievement(id, toBackendPatch(edits));
    const mapped = toFrontend(updated);
    setAchievements((prev) => prev.map((a) => (a.id === id ? mapped : a)));
    return true;
  }, []);

  // 进度更新（Step 3）：只改 current_value，不碰其他字段
  // 学习点：后端 PUT 接口是“只更新传入字段”，所以这里直接传给 api.updateProgress 即可。
  const updateProgress = useCallback(async (id, currentValue) => {
    const updated = await backend.updateProgress(id, currentValue);
    const mapped = toFrontend(updated);
    setAchievements((prev) => prev.map((a) => (a.id === id ? mapped : a)));
    return true;
  }, []);

  // 删除
  const deleteAchievement = useCallback(async (id) => {
    await backend.deleteAchievement(id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  // 清空（逐个删除，因为后端没有“清空全部”接口）
  const clearAllAchievements = useCallback(async () => {
    const ids = achievements.map((a) => a.id);
    await Promise.all(ids.map((id) => backend.deleteAchievement(id).catch(() => {})));
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

  // 从 JSON 导入（两遍法保树结构：先建树根里程碑拿到新 id，再把子卡挂回去）
  const importData = useCallback(async (jsonData) => {
    const data = JSON.parse(jsonData);
    if (!data.achievements || !Array.isArray(data.achievements)) {
      throw new Error('数据格式错误：缺少 achievements 数组');
    }
    const valid = data.achievements.filter((i) => i && typeof i === 'object' && i.title);
    const idMap = {}; // 导出文件里的旧 id -> 导入后的新 id
    // 第一遍：树根里程碑（无父的 milestone），落库后 root_id 自动指向自己
    for (const item of valid.filter((i) => (i.kind ?? 'card') === 'milestone' && !i.parentId)) {
      const created = await backend.createAchievement(toBackend({ ...item, parentId: undefined }));
      idMap[item.id] = created.id;
      setAchievements((prev) => [toFrontend(created), ...prev]);
    }
    // 第二遍：其余节点。父在本批里就重挂到新 id，否则落为独立节点（不挂到不存在的 id 上）
    for (const item of valid) {
      if (idMap[item.id]) continue;
      const created = await backend.createAchievement(
        toBackend({ ...item, parentId: idMap[item.parentId] ?? null })
      );
      idMap[item.id] = created.id;
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
