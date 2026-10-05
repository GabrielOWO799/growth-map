// src/constants/achievements.js
// 隐藏成就 / 称号定义表（只在代码里，不占数据库）。
// 全部由 ledger 的派生数据判定：解锁与否不落库，随处重算，账实相符。
export const HIDDEN_ACHIEVEMENTS = [
  {
    id: 'first',
    icon: '🎖️',
    name: '首枚印章',
    desc: '完成你的第一张成就卡',
    hidden: false,
    cond: (m) => m.doneCards >= 1,
  },
  {
    id: 'trickle',
    icon: '🌊',
    name: '涓流成河',
    desc: '连续 7 天都有记录',
    hidden: true,
    cond: (m) => m.streak.longest >= 7,
  },
  {
    id: 'deeproot',
    icon: '🌳',
    name: '深根',
    desc: '一棵技能树聚集 10 张子卡',
    hidden: true,
    cond: (m) => m.maxTreeSize >= 10,
  },
  {
    id: 'platinum',
    icon: '💠',
    name: '白金时刻',
    desc: '集齐一整棵技能树',
    hidden: true,
    cond: (m) => m.treesCompleted >= 1,
  },
  {
    id: 'spread',
    icon: '🌿',
    name: '开枝散叶',
    desc: '同时培育 2 棵以上的树',
    hidden: true,
    cond: (m) => m.trees.length >= 2,
  },
  {
    id: 'roundly',
    icon: '🧭',
    name: '面面俱到',
    desc: '使用过 4 种以上不同的标签',
    hidden: false,
    cond: (m) => m.distinctTags >= 4,
  },
  {
    id: 'fifty',
    icon: '💯',
    name: '五十而立',
    desc: '累计记录 50 张成就卡',
    hidden: true,
    cond: (m) => m.totalCards >= 50,
  },
  {
    id: 'punctual',
    icon: '⏰',
    name: '守时者',
    desc: '完成 5 张任务卡',
    hidden: true,
    cond: (m) => m.doneTasks >= 5,
  },
];
