// src/hooks/useAchievements.js
import { useState, useEffect, useCallback } from 'react';
import { loadAchievements, saveAchievements, getStorageInfo } from '../utils/storage';
/**
 * 自定义Hook：管理成就数据
 * @returns {Object} 成就数据和操作函数
 */
function useAchievements() {
  // 状态：成就列表
  const [achievements, setAchievements] = useState([]);
  
  // 状态：加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 状态：存储信息
  const [storageInfo, setStorageInfo] = useState({
    hasData: false,
    count: 0,
    size: 0
  });

  /**
   * 加载成就数据
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('开始加载成就数据...');
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const savedAchievements = loadAchievements();
      
      if (savedAchievements && savedAchievements.length > 0) {
        // 使用保存的数据
        setAchievements(savedAchievements);
        console.log(`从本地存储加载了 ${savedAchievements.length} 个成就`);
      } else {
        // 使用初始示例数据
        const initialData = getInitialAchievements();
        setAchievements(initialData);
        saveAchievements(initialData);
        console.log('使用初始数据');
      }
      
      // 更新存储信息
      setStorageInfo(getStorageInfo());
      
    } catch (error) {
      console.error('加载数据失败:', error);
      // 出错时使用空数组
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 添加成就
   * @param {Object} newAchievement 新成就数据
   */
  const addAchievement = useCallback((newAchievement) => {
    // 生成新ID（现有最大ID + 1）
    const newId = achievements.length > 0 
      ? Math.max(...achievements.map(a => a.id)) + 1 
      : 1;
    
    const achievementWithId = {
      ...newAchievement,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    // 更新状态
    const updatedAchievements = [achievementWithId, ...achievements];
    setAchievements(updatedAchievements);
    
    console.log('添加新成就，ID:', newId);
    return newId;
  }, [achievements]);

  /**
   * 删除成就
   * @param {number} id 成就ID
   */
  const deleteAchievement = useCallback((id) => {
    const updatedAchievements = achievements.filter(a => a.id !== id);
    setAchievements(updatedAchievements);
    
    console.log('删除成就，ID:', id);
    return true;
  }, [achievements]);

  /**
   * 更新成就
   * @param {number} id 成就ID
   * @param {Object} updates 更新数据
   */
  const updateAchievement = useCallback((id, updates) => {
    const updatedAchievements = achievements.map(achievement => 
      achievement.id === id 
        ? { ...achievement, ...updates, updatedAt: new Date().toISOString() }
        : achievement
    );
    
    setAchievements(updatedAchievements);
    console.log('更新成就，ID:', id);
    return true;
  }, [achievements]);

  /**
   * 清空所有成就
   */
  const clearAllAchievements = useCallback(() => {
    setAchievements([]);
    console.log('清空所有成就');
    return true;
  }, []);

  /**
   * 获取成就统计信息
   */
  const getStatistics = useCallback(() => {
    const total = achievements.length;
    const byTag = {};
    
    achievements.forEach(achievement => {
      const tag = achievement.tag;
      byTag[tag] = (byTag[tag] || 0) + 1;
    });
    
    // 按创建日期分组（最近7天）
    const last7Days = {};
    const now = new Date();
    
    achievements.forEach(achievement => {
      const date = new Date(achievement.createdAt || achievement.date);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        last7Days[diffDays] = (last7Days[diffDays] || 0) + 1;
      }
    });
    
    return {
      total,
      byTag,
      last7Days
    };
  }, [achievements]);

  /**
   * 导出成就数据
   */
  const exportData = useCallback(() => {
    const exportData = {
      achievements,
      exportDate: new Date().toISOString(),
      version: '1.0',
      count: achievements.length
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [achievements]);

  /**
   * 导入成就数据
   * @param {string} jsonData JSON格式的数据
   */
  const importData = useCallback((jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.achievements || !Array.isArray(data.achievements)) {
        throw new Error('数据格式错误：缺少achievements数组');
      }
      
      // 验证每个成就的基本结构
      const validAchievements = data.achievements.filter(item => 
        item && typeof item === 'object' && item.title
      );
      
      setAchievements(validAchievements);
      console.log(`导入 ${validAchievements.length} 个成就`);
      return validAchievements.length;
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }, []);

  // 加载数据（组件挂载时）
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 自动保存（成就列表变化时）
  useEffect(() => {
    if (achievements.length > 0 && !isLoading) {
      console.log('自动保存成就数据...');
      saveAchievements(achievements);
      setStorageInfo(getStorageInfo());
    }
  }, [achievements, isLoading]);

  // 返回数据和操作函数
  return {
    // 状态
    achievements,
    isLoading,
    storageInfo,
    
    // 操作函数
    addAchievement,
    deleteAchievement,
    updateAchievement,
    clearAllAchievements,
    
    // 工具函数
    getStatistics,
    exportData,
    importData,
    
    // 重新加载
    reload: loadData
  };
}

/**
 * 获取初始成就数据
 */
function getInitialAchievements() {
  return [
    {
      id: 1,
      title: '学习React组件',
      description: '理解了组件和props的基本概念',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
      tag: '学习',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: '完成5公里跑步',
      description: '坚持跑步5公里，配速6:30',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
      tag: '健身',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ];
}

export default useAchievements;