// src/components/StatisticsPanel.jsx
// 统计与账本面板：角色面板（等级/XP/四维/点数）+ 图鉴（标签/技能树）+ 任务 + 成就（称号）
// 全部数据由 ledger.js 派生，账本风格：只有数字、进度条和明暗，没有演出。
import { getTagColor, getTagEmoji } from '../constants/tags';

function StatisticsPanel({ statistics, onClose, wornTitle, onWearTitle }) {
  const {
    total = 0,
    last7Days = {},
    byTagCodex = {},
    trees = [],
    taskStats = { total: 0, done: 0, overdue: 0 },
    streak = { current: 0, longest: 0 },
    xp = 0,
    level = { level: 1, progress: 0, nextXp: 20 },
    points = 0,
    attrs = {},
    hiddenAchievements = [],
  } = statistics;

  // 标签图鉴（完成度排序）
  const codexRows = Object.entries(byTagCodex)
    .map(([tag, { total: t, done }]) => ({
      tag,
      total: t,
      done,
      pct: t > 0 ? Math.round((done / t) * 100) : 0,
      color: getTagColor(tag),
      emoji: getTagEmoji(tag),
    }))
    .sort((a, b) => b.done - a.done || b.total - a.total);

  // 最近 7 天活动
  const last7DaysLabels = ['今天', '昨天', '2天前', '3天前', '4天前', '5天前', '6天前'];
  const last7DaysData = last7DaysLabels.map((label, index) => ({
    label,
    count: last7Days[index] || 0,
  }));

  const unlockedCount = hiddenAchievements.filter((a) => a.unlocked).length;

  return (
    <div className="statistics-panel">
      <div className="panel-header">
        <h3>📊 统计与账本</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="statistics-content">
        {/* 概览 */}
        <div className="overview-section">
          <div className="overview-item">
            <div className="overview-value">{total}</div>
            <div className="overview-label">记录总数</div>
          </div>
          <div className="overview-item">
            <div className="overview-value">{last7DaysData.reduce((s, d) => s + d.count, 0)}</div>
            <div className="overview-label">最近 7 天</div>
          </div>
          <div className="overview-item">
            <div className="overview-value">{streak.current}</div>
            <div className="overview-label">连续 {streak.longest} 天（最长）</div>
          </div>
        </div>

        {/* 角色面板 */}
        <div className="role-section">
          <h4>🧙 角色面板</h4>
          <div className="role-line">
            <span className="level-badge">Lv.{level.level}</span>
            <div className="progress-bar role-xp">
              <div className="progress-fill" style={{ width: `${level.progress}%` }} />
            </div>
            <span className="role-xp-num">{xp} XP</span>
          </div>
          <p className="role-sub">距 Lv.{level.level + 1} 还需 {Math.max(0, level.nextXp - xp)} XP · 成就点数 {points}（只累计，不可消费）</p>
          <div className="attrs-grid">
            {Object.entries(attrs).map(([name, { value, unit, hint }]) => (
              <div key={name} className="attr-item" title={hint}>
                <div className="attr-value">{value}<small>{unit}</small></div>
                <div className="attr-name">{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 图鉴 · 标签 */}
        {codexRows.length > 0 && (
          <div className="codex-section">
            <h4>🗂️ 图鉴 · 标签（完成/总数）</h4>
            {codexRows.map(({ tag, total: t, done, pct, color, emoji }) => (
              <div key={tag} className="tag-distribution-item">
                <div className="tag-distribution-header">
                  <span className="tag-emoji">{emoji}</span>
                  <span className="tag-name">{tag}</span>
                  <span className="tag-count">{done}/{t}（{pct}%）</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 图鉴 · 技能树 */}
        {trees.length > 0 && (
          <div className="codex-section">
            <h4>🌲 图鉴 · 技能树（点亮/总数）</h4>
            {trees.map((t) => {
              const pct = t.total ? Math.round((t.lit / t.total) * 100) : 0;
              return (
                <div key={t.id} className="tag-distribution-item">
                  <div className="tag-distribution-header">
                    <span className="tag-emoji">{t.complete ? '🌟' : '⭐'}</span>
                    <span className="tag-name">{t.title}</span>
                    <span className="tag-count">{t.lit}/{t.total}（{pct}%）</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: t.complete ? 'var(--tier-platinum)' : 'var(--primary)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 任务 */}
        {taskStats.total > 0 && (
          <div className="codex-section">
            <h4>✅ 任务</h4>
            <ul className="summary-list">
              <li>共 {taskStats.total} 个 · 已完成 {taskStats.done} 个{taskStats.overdue > 0 ? ` · ⚠️ 逾期 ${taskStats.overdue} 个` : ''}</li>
            </ul>
          </div>
        )}

        {/* 成就（称号） */}
        <div className="codex-section">
          <h4>🏅 成就（{unlockedCount}/{hiddenAchievements.length}）· 点亮可佩戴为称号</h4>
          <div className="ach-grid">
            {hiddenAchievements.map((a) => {
              const label = a.unlocked ? a.name : a.hidden ? '？？?' : a.name;
              const desc = a.unlocked || !a.hidden ? a.desc : '隐藏成就 · 继续记录解锁';
              const worn = wornTitle === a.name;
              return (
                <button
                  key={a.id}
                  className={`ach-item ${a.unlocked ? 'unlocked' : 'locked'} ${worn ? 'worn' : ''}`}
                  title={a.unlocked ? (worn ? '点击取下称号' : '点击佩戴为称号') : desc}
                  onClick={() => {
                    if (!a.unlocked) return;
                    onWearTitle(worn ? null : a.name);
                  }}
                >
                  <span className="ach-icon">{a.unlocked ? a.icon : a.hidden ? '❔' : a.icon}</span>
                  <span className="ach-name">{label}</span>
                  <span className="ach-desc">{desc}</span>
                  {worn && <span className="ach-worn">佩戴中</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 最近 7 天活动 */}
        <div className="recent-activity-section">
          <h4>📅 最近 7 天活动</h4>
          <div className="activity-chart">
            {last7DaysData.map(({ label, count }) => (
              <div key={label} className="activity-item">
                <div className="activity-label">{label}</div>
                <div className="activity-bar-container">
                  <div
                    className="activity-bar"
                    style={{
                      height: `${Math.min(count * 20, 100)}%`,
                      backgroundColor: count > 0 ? 'var(--green)' : 'var(--line)',
                    }}
                  />
                </div>
                <div className="activity-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsPanel;
