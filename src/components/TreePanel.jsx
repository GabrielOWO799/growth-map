// src/components/TreePanel.jsx
// 技能树（森林模式）MVP 视图：
//   - 每棵树 = 一个无父的里程碑节点（树根），日常卡片挂在它下面
//   - 里程碑的"点亮"是派生状态：子卡全部完成(current>=target)即整树点亮，不落库
//   - 账本风格：没有动画演出，只有数量、进度条和明暗两种状态
import { useState } from 'react';
import { TAGS, getTagColor, getTagEmoji } from '../constants/tags';
import TreeInferPanel from './TreeInferPanel';
import { IS_DEMO_MODE } from '../config';
import './TreePanel.css';

const EMPTY_DRAFT = { title: '', target: '', tag: '学习' };

function TreePanel({ achievements, onAdd, onDelete, onLightUp, onMoveCard, isLoading }) {
  const [newTreeTitle, setNewTreeTitle] = useState('');
  // 每棵树一个"挂卡"草稿：rootId -> {title, target, tag}
  const [drafts, setDrafts] = useState({});
  // AI 推演上下文（一次只开一个）：{mode:'seed'|'expand', seedId?, seedTitle?, seedTag?, rootId?, rootTitle?, rootTag?}
  const [infer, setInfer] = useState(null);

  // ---- 森林组装（全部在前端从平铺列表推导，后端不需要树专用接口） ----
  const roots = achievements.filter((a) => a.kind === 'milestone' && !a.parentId);
  const childrenOf = {};
  achievements.forEach((a) => {
    if (a.parentId) (childrenOf[a.parentId] ||= []).push(a);
  });
  Object.values(childrenOf).forEach((list) => list.sort((x, y) => x.id - y.id));
  const looseCards = achievements.filter((a) => !a.parentId && a.kind !== 'milestone');
  const cardCount = achievements.filter((a) => a.kind === 'card').length;

  const isLit = (a) =>
    typeof a.currentValue === 'number' &&
    typeof a.targetValue === 'number' &&
    a.currentValue >= a.targetValue;

  const setDraft = (rootId, patch) =>
    setDrafts((prev) => ({ ...prev, [rootId]: { ...(prev[rootId] || EMPTY_DRAFT), ...patch } }));

  const handleCreateTree = async (e) => {
    e.preventDefault();
    if (!newTreeTitle.trim()) return;
    try {
      await onAdd({ title: newTreeTitle.trim(), tag: '学习', kind: 'milestone' });
      setNewTreeTitle('');
    } catch (err) {
      alert('建树失败：' + (err && err.message ? err.message : '未知错误'));
    }
  };

  const handleAddChild = async (rootId) => {
    const draft = drafts[rootId] || EMPTY_DRAFT;
    if (!draft.title || !draft.title.trim()) return;
    try {
      await onAdd({
        title: draft.title.trim(),
        tag: draft.tag || '学习',
        kind: 'card',
        parentId: rootId,
        targetValue: Number(draft.target) || 1,
      });
      setDrafts((prev) => ({ ...prev, [rootId]: { ...EMPTY_DRAFT, tag: draft.tag || '学习' } }));
    } catch (err) {
      alert('挂卡失败：' + (err && err.message ? err.message : '未知错误'));
    }
  };

  const handleDelete = async (node) => {
    try {
      await onDelete(node.id);
    } catch (err) {
      alert('删除失败：' + (err && err.message ? err.message : '未知错误'));
    }
  };

  const handleLightUp = async (child) => {
    try {
      await onLightUp(child.id, child.targetValue);
    } catch (err) {
      alert('点亮失败：' + (err && err.message ? err.message : '未知错误'));
    }
  };

  // 推演确认：seed 模式建树根 -> 把种子卡移进树 -> 逐条建建议卡；expand 模式直接往树上挂
  const handleInferConfirm = async ({ milestoneTitle, suggestions }) => {
    try {
      let rootId = infer.rootId;
      if (infer.mode === 'seed') {
        const treeId = await onAdd({
          title: milestoneTitle,
          tag: infer.seedTag || '学习',
          kind: 'milestone',
        });
        rootId = treeId;
        await onMoveCard(infer.seedId, rootId);
      }
      for (const s of suggestions) {
        if (!s.title.trim()) continue;
        await onAdd({
          title: s.title.trim(),
          tag: infer.mode === 'seed' ? infer.seedTag || '学习' : infer.rootTag || '学习',
          kind: 'card',
          parentId: rootId,
          difficulty: s.difficulty,
        });
      }
      setInfer(null);
    } catch (err) {
      alert('创建失败：' + (err && err.message ? err.message : '未知错误'));
    }
  };

  return (
    <div className="tree-panel">
      <div className="tree-panel-header">
        <h2>🌲 技能树</h2>
        <p className="tree-panel-subtitle">
          {roots.length} 棵树 · {cardCount} 张卡 · 子卡集齐后里程碑自动点亮
        </p>
      </div>

      <form className="new-tree-form" onSubmit={handleCreateTree}>
        <input
          value={newTreeTitle}
          onChange={(e) => setNewTreeTitle(e.target.value)}
          placeholder="新树名称，如：Python 学习"
          disabled={isLoading}
        />
        <button type="submit" className="tree-btn primary" disabled={isLoading || !newTreeTitle.trim()}>
          🌱 新建树
        </button>
      </form>

      {infer && (
        <TreeInferPanel
          infer={infer}
          onClose={() => setInfer(null)}
          onConfirm={handleInferConfirm}
        />
      )}

      {roots.length === 0 && (
        <div className="tree-empty">
          还没有树。建一棵树、把学习卡片挂上去，子卡全部完成时整棵树点亮。
        </div>
      )}

      <div className="forest">
        {roots.map((root) => {
          const children = childrenOf[root.id] || [];
          const litCount = children.filter(isLit).length;
          const treeDone = children.length > 0 && litCount === children.length;
          return (
            <div key={root.id} className={`tree-card ${treeDone ? 'complete' : ''}`}>
              <div className="tree-root">
                <div className="tree-root-title">
                  <span className="tree-root-emoji">{treeDone ? '🌟' : '⭐'}</span>
                  <span className="tree-root-name">{root.title}</span>
                </div>
                <span className="tree-root-count">{litCount}/{children.length}</span>
                {/* AI 推演依赖后端，演示模式下不显示 */}
                {!IS_DEMO_MODE && (
                  <button
                    className="tree-icon-btn"
                    title="AI 推演：补充这棵树缺的子卡"
                    onClick={() =>
                      setInfer({
                        mode: 'expand',
                        rootId: root.id,
                        rootTitle: root.title,
                        rootTag: root.tag,
                      })
                    }
                  >
                    🧭
                  </button>
                )}
                <button
                  className="tree-icon-btn"
                  title="删除树（需先删除全部子卡）"
                  onClick={() => handleDelete(root)}
                >
                  🗑️
                </button>
              </div>
              <div className="tree-root-bar">
                <div
                  className="tree-root-bar-fill"
                  style={{ width: `${children.length ? (litCount / children.length) * 100 : 0}%` }}
                />
              </div>

              <ul className="tree-children">
                {children.map((child) => (
                  <li key={child.id} className={`tree-child ${isLit(child) ? 'lit' : 'dim'}`}>
                    <span className="tree-child-dot" />
                    <span
                      className="tree-child-tag"
                      style={{ color: getTagColor(child.tag) }}
                      title={child.tag}
                    >
                      {getTagEmoji(child.tag)}
                    </span>
                    <span className="tree-child-title">{child.title}</span>
                    {child.difficulty && (
                      <span className={`tree-child-difficulty d${child.difficulty}`} title="难度评级">
                        {child.difficulty}
                      </span>
                    )}
                    {isLit(child) ? (
                      <span className="tree-child-badge done">✓ {child.currentValue}/{child.targetValue}</span>
                    ) : (
                      <>
                        <span className="tree-child-badge">{child.currentValue}/{child.targetValue}</span>
                        <button className="tree-light-btn" onClick={() => handleLightUp(child)}>
                          点亮
                        </button>
                      </>
                    )}
                    <button className="tree-icon-btn" title="删除" onClick={() => handleDelete(child)}>
                      ✕
                    </button>
                  </li>
                ))}
                {children.length === 0 && <li className="tree-child none">还没有子卡</li>}
              </ul>

              <div className="tree-add-child">
                <input
                  value={(drafts[root.id] || EMPTY_DRAFT).title}
                  onChange={(e) => setDraft(root.id, { title: e.target.value })}
                  placeholder="子卡标题，如：学习数组基础"
                  disabled={isLoading}
                />
                <input
                  type="number"
                  min="1"
                  className="tree-target-input"
                  value={(drafts[root.id] || EMPTY_DRAFT).target}
                  onChange={(e) => setDraft(root.id, { target: e.target.value })}
                  placeholder="目标"
                  disabled={isLoading}
                />
                <select
                  value={(drafts[root.id] || EMPTY_DRAFT).tag}
                  onChange={(e) => setDraft(root.id, { tag: e.target.value })}
                  disabled={isLoading}
                >
                  {TAGS.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <button className="tree-btn" onClick={() => handleAddChild(root.id)} disabled={isLoading}>
                  ＋ 挂卡
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {looseCards.length > 0 && (
        <div className="loose-section">
          <h3>📋 未上树的散卡（{looseCards.length}）</h3>
          <p className="loose-hint">在成就墙正常记录的卡片，之后可以把它们挂到树上。</p>
          <div className="loose-list">
            {looseCards.map((c) => (
              <span key={c.id} className="loose-chip" style={{ borderColor: `${getTagColor(c.tag)}66` }}>
                {getTagEmoji(c.tag)} {c.title}
                {!IS_DEMO_MODE && (
                  <button
                    className="tree-icon-btn"
                    title="AI 推演：以这张卡为种子长出一棵树"
                    onClick={() =>
                      setInfer({
                        mode: 'seed',
                        seedId: c.id,
                        seedTitle: c.title,
                        seedTag: c.tag,
                      })
                    }
                  >
                    🧭
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TreePanel;
