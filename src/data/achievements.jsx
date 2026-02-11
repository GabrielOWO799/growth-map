// 创建文件夹：src/data/
// 创建文件：src/data/achievements.js

// 成就的数据结构
const achievementStructure = {
  id: '唯一标识',
  title: '成就标题',
  description: '详细描述',
  imageUrl: '图片地址',
  tag: '标签（学习/健身/工作/生活）',
  date: '创建日期'
};

// 示例数据（初始成就列表）
export const initialAchievements = [
  {
    id: 1,
    title: '学习React组件',
    description: '理解了组件和props的基本概念',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    tag: '学习',
    date: '2024-01-15'
  },
  {
    id: 2,
    title: '完成5公里跑步',
    description: '坚持跑步5公里，配速6:30',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
    tag: '健身',
    date: '2024-01-16'
  }
];

// 标签配置
export const tags = [
  { id: 'study', name: '学习', emoji: '📚', color: '#3498db' },
  { id: 'fitness', name: '健身', emoji: '💪', color: '#2ecc71' },
  { id: 'work', name: '工作', emoji: '💼', color: '#9b59b6' },
  { id: 'life', name: '生活', emoji: '🏡', color: '#e67e22' }
];