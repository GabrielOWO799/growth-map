// src/localBackend.js
// 演示模式的数据层：用 localStorage 模拟后端 API。
// 关键约定：存取的都是"后端形状"的记录（category/target_value/created_at...），
// 这样 useAchievements 里现有的 toFrontend/toBackend 映射一行都不用改。
// 函数签名与 src/api.jsx 一一对应，两条数据层可以无缝互换。
import { IS_DEMO_MODE } from './config';

const STORE_KEY = 'gm_demo_data';
const SEED_FLAG = 'gm_demo_seeded_v1';

// ---- 种子数据：首次进入演示时铺一条"成长路径"，展示界面用的示例 ----
function seedData() {
  const now = Date.now();
  const daysAgo = (n) => new Date(now - n * 24 * 3600 * 1000).toISOString();
  return [
    {
      id: 1, kind: 'milestone', title: '掌握 Python 容器基础', description: '数组、列表、字典、集合',
      category: '学习', target_value: 1, current_value: 0, parent_id: null, root_id: 1,
      image_url: null, difficulty: 'A', due_date: null, created_at: daysAgo(6),
    },
    {
      id: 2, kind: 'card', title: '学习 Python 数组基础', description: '理解了索引与切片',
      category: '学习', target_value: 5, current_value: 5, parent_id: 1, root_id: 1,
      image_url: null, difficulty: 'C', due_date: null, created_at: daysAgo(5),
    },
    {
      id: 3, kind: 'card', title: '学习 Python 列表与元组', description: '掌握了常用方法与不可变序列',
      category: '学习', target_value: 3, current_value: 3, parent_id: 1, root_id: 1,
      image_url: null, difficulty: 'B', due_date: null, created_at: daysAgo(3),
    },
    {
      id: 4, kind: 'card', title: '学习 Python 字典与集合', description: '',
      category: '学习', target_value: 3, current_value: 0, parent_id: 1, root_id: 1,
      image_url: null, difficulty: 'B', due_date: null, created_at: daysAgo(1),
    },
    {
      id: 5, kind: 'card', title: '完成项目周报', description: '整理了本周开发进展',
      category: '工作', target_value: 1, current_value: 1, parent_id: null, root_id: null,
      image_url: null, difficulty: 'C', due_date: null, created_at: daysAgo(2),
    },
    {
      id: 6, kind: 'card', title: '晨跑 5 公里', description: '坚持第三周',
      category: '健身', target_value: 1, current_value: 0, parent_id: null, root_id: null,
      image_url: null, difficulty: 'C', due_date: null, created_at: daysAgo(0),
    },
  ];
}

function load() {
  if (localStorage.getItem(SEED_FLAG) !== '1') {
    const data = seedData();
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    localStorage.setItem(SEED_FLAG, '1');
    return data;
  }
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// ---------- 与 api.jsx 同签名的五个函数 ----------
export async function fetchAchievements() {
  // 模仿后端：按创建时间倒序
  return load().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function createAchievement(payload) {
  const list = load();
  const record = {
    id: nextId(list),
    description: null,
    target_value: 1,
    current_value: 0,
    kind: 'card',
    parent_id: null,
    root_id: null,
    image_url: null,
    difficulty: null,
    due_date: null,
    ...payload,
    created_at: new Date().toISOString(),
  };
  // 模仿后端 root_id 语义：无父里程碑自己是树根
  if (record.parent_id === null && record.kind === 'milestone') record.root_id = record.id;
  list.push(record);
  save(list);
  return record;
}

export async function updateAchievement(id, payload) {
  const list = load();
  const record = list.find((r) => r.id === id);
  if (!record) throw new Error('成就不存在');
  Object.assign(record, payload);
  if (record.parent_id === null && record.kind === 'milestone') record.root_id = record.id;
  save(list);
  return { ...record };
}

export async function updateProgress(id, currentValue) {
  return updateAchievement(id, { current_value: currentValue });
}

export async function deleteAchievement(id) {
  const list = load();
  const hasChildren = list.some((r) => r.parent_id === id);
  if (hasChildren) throw new Error('该节点下还有子节点，请先删除子节点');
  save(list.filter((r) => r.id !== id));
  return { message: '删除成功' };
}

// 供演示横幅做"重置演示数据"用（可选入口以后再接）
export function resetDemoData() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(SEED_FLAG);
}

export { IS_DEMO_MODE };
