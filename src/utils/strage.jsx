// src/utils/storage.js - 添加新功能

// ... 原有代码 ...

/**
 * 备份数据
 */
export const backupAchievements = () => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!data) return null;
    
    const backupKey = `${ACHIEVEMENTS_KEY}-backup-${Date.now()}`;
    localStorage.setItem(backupKey, data);
    
    console.log(`数据备份成功，备份键：${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error('备份失败:', error);
    return null;
  }
};

/**
 * 恢复备份
 */
export const restoreFromBackup = (backupKey) => {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('备份不存在');
    }
    
    localStorage.setItem(ACHIEVEMENTS_KEY, backupData);
    console.log(`从备份 ${backupKey} 恢复数据成功`);
    return JSON.parse(backupData);
  } catch (error) {
    console.error('恢复失败:', error);
    throw error;
  }
};

/**
 * 获取所有备份
 */
export const getAllBackups = () => {
  const backups = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`${ACHIEVEMENTS_KEY}-backup-`)) {
      try {
        const data = localStorage.getItem(key);
        const achievements = JSON.parse(data);
        backups.push({
          key,
          timestamp: parseInt(key.split('-').pop()),
          count: achievements.length,
          size: new Blob([data]).size
        });
      } catch (e) {
        // 跳过无效数据
      }
    }
  }
  
  // 按时间戳排序，最新的在前面
  return backups.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * 清理旧备份（保留最近5个）
 */
export const cleanupOldBackups = () => {
  const backups = getAllBackups();
  
  if (backups.length > 5) {
    const toRemove = backups.slice(5);
    
    toRemove.forEach(backup => {
      localStorage.removeItem(backup.key);
      console.log(`清理旧备份：${backup.key}`);
    });
    
    return toRemove.length;
  }
  
  return 0;
};