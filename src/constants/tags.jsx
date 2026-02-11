// src/constants/tags.js

/**
 * 成就标签配置
 */
export const TAGS = [
  { 
    id: 'study', 
    name: '学习', 
    emoji: '📚', 
    color: '#3498db',
    description: '学习和知识获取'
  },
  { 
    id: 'fitness', 
    name: '健身', 
    emoji: '💪', 
    color: '#2ecc71',
    description: '运动和健康'
  },
  { 
    id: 'work', 
    name: '工作', 
    emoji: '💼', 
    color: '#9b59b6',
    description: '工作和项目'
  },
  { 
    id: 'life', 
    name: '生活', 
    emoji: '🏡', 
    color: '#e67e22',
    description: '生活和兴趣爱好'
  },
  { 
    id: 'creative', 
    name: '创作', 
    emoji: '🎨', 
    color: '#e74c3c',
    description: '艺术和创作'
  },
  { 
    id: 'social', 
    name: '社交', 
    emoji: '👥', 
    color: '#1abc9c',
    description: '社交和人际关系'
  }
];

/**
 * 根据标签名称获取标签配置
 */
export const getTagConfig = (tagName) => {
  return TAGS.find(tag => tag.name === tagName) || TAGS[0];
};

/**
 * 获取所有标签名称
 */
export const getTagNames = () => {
  return TAGS.map(tag => tag.name);
};

/**
 * 获取标签颜色
 */
export const getTagColor = (tagName) => {
  const tag = getTagConfig(tagName);
  return tag ? tag.color : TAGS[0].color;
};

/**
 * 获取标签emoji
 */
export const getTagEmoji = (tagName) => {
  const tag = getTagConfig(tagName);
  return tag ? tag.emoji : TAGS[0].emoji;
};