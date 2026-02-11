// src/utils/storage.js

// 成就数据的存储key
const ACHIEVEMENTS_KEY = 'growth-map-achievements';

/**
 * 从本地存储加载成就数据
 * @returns {Array} 成就列表
 */
export const loadAchievements = () => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null; // 没有保存的数据
  } catch (error) {
    console.error('读取本地存储失败:', error);
    return null;
  }
};

/**
 * 保存成就数据到本地存储
 * @param {Array} achievements 成就列表
 */
export const saveAchievements = (achievements) => {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('保存到本地存储失败:', error);
    // 可以在这里添加错误处理，如提示用户
  }
};

/**
 * 清除所有保存的成就数据
 */
export const clearAchievements = () => {
  localStorage.removeItem(ACHIEVEMENTS_KEY);
};

/**
 * 获取存储统计信息
 * @returns {Object} 存储信息
 */
export const getStorageInfo = () => {
  const data = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (!data) return { hasData: false };
  
  const achievements = JSON.parse(data);
  return {
    hasData: true,
    count: achievements.length,
    size: new Blob([data]).size, // 字节大小
    lastModified: new Date().toLocaleString() // 简单的时间戳
  };
};

// 导出所有函数
export default {
  loadAchievements,
  saveAchievements,
  clearAchievements,
  getStorageInfo
};