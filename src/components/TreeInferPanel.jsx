// src/components/TreeInferPanel.jsx
// AI 推演预览面板（账本风格：无翻牌无动画，就是一张可编辑的建议清单）：
//   打开即调 /trees/infer 拿建议 -> 用户改标题/换难度/删行/加行 -> 确认后由父组件落库
//   产品约定：AI 只建议，用户终审。
import { useEffect, useState } from 'react';
import { inferTree } from '../api';

const DIFFICULTY_OPTIONS = [
  { value: 'A', label: 'A · 大目标' },
  { value: 'B', label: 'B · 中等' },
  { value: 'C', label: 'C · 轻量' },
];

const EMPTY_SUGGESTION = { title: '', difficulty: 'B', reason: '' };

function TreeInferPanel({ infer, onClose, onConfirm }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const payload =
        infer.mode === 'seed' ? { achievement_id: infer.seedId } : { root_id: infer.rootId };
      const data = await inferTree(payload);
      setMilestoneTitle(data.milestone_title || '');
      setSuggestions(
        (data.suggestions || []).map((s) => ({
          title: s.title || '',
          difficulty: s.difficulty || 'B',
          reason: s.reason || '',
        }))
      );
    } catch (e) {
      setError(e && e.message ? e.message : '推演失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开面板自动推演一次
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (index, patch) =>
    setSuggestions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const canConfirm =
    !loading &&
    !error &&
    (infer.mode !== 'seed' || milestoneTitle.trim()) &&
    suggestions.some((s) => s.title.trim());

  return (
    <div className="infer-panel">
      <div className="infer-header">
        <h3>
          🧭 AI 推演
          {infer.mode === 'seed' ? (
            <span className="infer-mode">种子卡「{infer.seedTitle}」→ 候选树</span>
          ) : (
            <span className="infer-mode">为「{infer.rootTitle}」补充子卡</span>
          )}
        </h3>
        <button className="tree-icon-btn" onClick={onClose} title="关闭">✕</button>
      </div>

      {loading && (
        <div className="infer-loading">
          <div className="loading-spinner small"></div>
          推演中，通常需要十几秒…
        </div>
      )}

      {error && !loading && (
        <div className="infer-error">
          <p>⚠️ {error}</p>
          <button className="tree-btn" onClick={run}>重试</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="infer-hint">以下是 AI 的建议，增删改完全由你决定：</p>

          {infer.mode === 'seed' && (
            <div className="infer-milestone">
              <label>汇聚里程碑（树根）</label>
              <input
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="如：学完 Python 容器"
              />
            </div>
          )}

          <div className="infer-rows">
            {suggestions.map((row, index) => (
              <div key={index} className="infer-row">
                <input
                  value={row.title}
                  onChange={(e) => updateRow(index, { title: e.target.value })}
                  placeholder="卡片标题"
                />
                <select
                  value={row.difficulty}
                  onChange={(e) => updateRow(index, { difficulty: e.target.value })}
                  title={`难度（AI 建议：${row.difficulty}）`}
                >
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <button
                  className="tree-icon-btn"
                  title={row.reason ? `AI 理由：${row.reason}` : '删除此行'}
                  onClick={() => setSuggestions((prev) => prev.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
                {row.reason && <div className="infer-reason">AI 理由：{row.reason}</div>}
              </div>
            ))}
          </div>

          <button
            className="tree-btn add-row-btn"
            onClick={() => setSuggestions((prev) => [...prev, { ...EMPTY_SUGGESTION }])}
          >
            ＋ 自己加一条
          </button>

          <div className="infer-actions">
            <button className="tree-btn" onClick={onClose}>取消</button>
            <button
              className="tree-btn primary"
              disabled={!canConfirm}
              onClick={() => onConfirm({ milestoneTitle: milestoneTitle.trim(), suggestions })}
            >
              ✓ 确认创建
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TreeInferPanel;
