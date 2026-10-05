// src/ledger.js
// 账本计算层：所有"游戏化的账目"都从这里纯函数推导——不落库、不加表。
// 设计宪法：只做账本不做舞台——每个数字都是真实发生过的努力的重新陈述。
import { HIDDEN_ACHIEVEMENTS } from './constants/achievements';

// 难度 → XP（完成时结算）：A=大目标 30 / B=中等 15 / C=轻量 5
const XP_BY_DIFFICULTY = { A: 30, B: 15, C: 5 };
// 集齐一棵树的奖励
const XP_TREE_COMPLETE = 50;

export function isDone(a) {
  return (
    typeof a.currentValue === 'number' &&
    typeof a.targetValue === 'number' &&
    a.currentValue >= a.targetValue
  );
}

// 本地时区的 YYYY-MM-DD（创建时间统一按"哪一天"归档）
function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function diffDaysFromToday(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((today - d) / 86400000);
}

// 温柔版 streak：只庆祝，不惩罚。今天没记录不断签（昨天有就算延续中）。
function computeStreak(days) {
  const set = new Set(days);
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const key of sorted) {
    if (prev !== null && diffDaysFromToday(prev) - diffDaysFromToday(key) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = key;
  }
  // 当前连续：从今天（或昨天）往回数
  let current = 0;
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = dayKey(new Date(new Date(cursor).getTime() - 86400000).toISOString());
  }
  return { current, longest };
}

// 等级曲线：level = floor(sqrt(xp/20)) + 1，前期升级勤快（20→2级，80→3级，180→4级）
function computeLevel(xp) {
  const level = Math.floor(Math.sqrt(xp / 20)) + 1;
  const floorXp = 20 * (level - 1) ** 2;
  const nextXp = 20 * level ** 2;
  const progress = Math.min(100, Math.round(((xp - floorXp) / (nextXp - floorXp)) * 100));
  return { level, floorXp, nextXp, progress };
}

export function computeLedger(achievements) {
  const cards = achievements.filter((a) => a.kind !== 'milestone' && a.kind !== 'task');
  const tasks = achievements.filter((a) => a.kind === 'task');
  const roots = achievements.filter((a) => a.kind === 'milestone' && !a.parentId);

  const doneCards = cards.filter(isDone);
  const doneTasks = tasks.filter(isDone);

  // 标签图鉴（口径与后端统计一致：只认成就卡）
  const byTag = {};
  const byTagCodex = {};
  cards.forEach((a) => {
    byTag[a.tag] = (byTag[a.tag] || 0) + 1;
    const slot = (byTagCodex[a.tag] ||= { total: 0, done: 0 });
    slot.total += 1;
    if (isDone(a)) slot.done += 1;
  });

  // 技能树图鉴
  const trees = roots.map((root) => {
    const children = achievements.filter((a) => a.parentId === root.id);
    const lit = children.filter(isDone).length;
    return { id: root.id, title: root.title, total: children.length, lit, complete: children.length > 0 && lit === children.length };
  });
  const maxTreeSize = trees.reduce((m, t) => Math.max(m, t.total), 0);
  const treesCompleted = trees.filter((t) => t.complete).length;
  const depth = trees.reduce((m, t) => Math.max(m, t.total ? Math.round((t.lit / t.total) * 100) : 0), 0);

  // 温柔 streak（所有真实记录都算：卡 + 任务）
  const recordDays = [...cards, ...tasks]
    .map((a) => dayKey(a.createdAt || a.date))
    .filter(Boolean);
  const streak = computeStreak(recordDays);

  // 最近 7 天活动（沿用原口径：0=今天）
  const last7Days = {};
  [...cards, ...tasks].forEach((a) => {
    const diff = diffDaysFromToday(a.createdAt || a.date);
    if (diff !== null && diff >= 0 && diff <= 7) last7Days[diff] = (last7Days[diff] || 0) + 1;
  });

  // XP / 等级 / 成就点数（点数只累计展示，不可消费——方案 b）
  const xp =
    doneCards.reduce((s, a) => s + (XP_BY_DIFFICULTY[a.difficulty] ?? XP_BY_DIFFICULTY.C), 0) +
    treesCompleted * XP_TREE_COMPLETE;
  const levelInfo = computeLevel(xp);
  const points = doneCards.length * 2 + treesCompleted * 20;

  // 任务账目
  const todayKey = dayKey(new Date().toISOString());
  const taskStats = {
    total: tasks.length,
    done: doneTasks.length,
    overdue: tasks.filter((t) => !isDone(t) && t.dueDate && t.dueDate < todayKey).length,
  };

  // 原始指标（供隐藏成就条件引用）
  const metrics = {
    doneCards: doneCards.length,
    totalCards: cards.length,
    doneTasks: doneTasks.length,
    streak,
    maxTreeSize,
    treesCompleted,
    trees,
    distinctTags: Object.keys(byTag).length,
    depth,
  };

  // 隐藏成就：全部由数据派生，解锁与否不落库
  const hiddenAchievements = HIDDEN_ACHIEVEMENTS.map((def) => ({
    id: def.id,
    icon: def.icon,
    name: def.name,
    desc: def.desc,
    hidden: !!def.hidden,
    unlocked: !!def.cond(metrics),
  }));

  return {
    // 旧接口兼容
    total: achievements.filter((a) => a.kind !== 'milestone').length,
    byTag,
    last7Days,
    // 新账本
    cardsTotal: cards.length,
    doneCards: doneCards.length,
    byTagCodex,
    trees,
    taskStats,
    streak,
    xp,
    level: levelInfo,
    points,
    attrs: {
      毅力: { value: streak.longest, unit: '天', hint: '最长连续记录' },
      广度: { value: metrics.distinctTags, unit: '种', hint: '涉足的标签数' },
      深度: { value: depth, unit: '%', hint: '最高单树完成度' },
      勤勉: { value: Object.values(last7Days).reduce((s, v) => s + v, 0), unit: '张', hint: '最近 7 天记录' },
    },
    hiddenAchievements,
  };
}
