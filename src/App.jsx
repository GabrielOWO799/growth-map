import { useState } from 'react';
import Card from './components/Card';
import AddAchievementForm from './components/AddAchievementForm';
import StatisticsPanel from './components/StatisticsPanel';
import ImportExportPanel from './components/ImportExportPanel';
import TreePanel from './components/TreePanel';
import AuthForm from './components/AuthForm';
import { TAGS } from './constants/tags';
import useAchievements from './hooks/useAchievements';
import { useAuth } from './auth/AuthContext';
import { IS_DEMO_MODE } from './config';
import './App.css';

// 同步状态文案
const SYNC_LABEL = {
  idle: '未登录',
  syncing: '同步中…',
  synced: '已同步',
  error: '同步失败',
};

function App() {
  const {
    achievements,
    isLoading,
    syncState, // 替代旧的 storageInfo
    reload,
    addAchievement,
    deleteAchievement,
    updateAchievement,
    clearAllAchievements,
    exportData,
    importData,
    getStatistics,
  } = useAchievements();

  // 登录态：未登录直接展示登录/注册页
  const { isAuthenticated, username, logout } = useAuth();
  const [showStatistics, setShowStatistics] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  // 主视图切换：'wall' 成就墙（日常记录）| 'tree' 技能树（森林）
  const [view, setView] = useState('wall');

  // 未登录：只渲染认证页
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // 获取统计信息
  const statistics = getStatistics();

  // 成就墙只展示普通卡/任务卡；里程碑是树的结构节点，只在技能树视图里出现
  const wallCards = achievements.filter((a) => a.kind !== 'milestone');

  // 添加示例数据
  const addExampleAchievement = () => {
    const exampleAchievements = [
      {
        title: '学习自定义Hook',
        description: '成功创建了第一个自定义Hook，理解了逻辑复用的重要性',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
        tag: '学习',
      },
      {
        title: '代码重构完成',
        description: '将项目重构为模块化结构，提高了代码可维护性',
        imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=250&fit=crop',
        tag: '工作',
      },
      {
        title: '冥想15分钟',
        description: '坚持每日冥想，感觉更加专注和平静',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
        tag: '生活',
      },
    ];
    exampleAchievements.forEach((achievement) => {
      addAchievement(achievement);
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🌱 成长图谱</h1>
            <p className="subtitle">记录你的每一份努力，见证成长的每一步</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setView(view === 'wall' ? 'tree' : 'wall')}
              className="header-button"
            >
              {view === 'wall' ? '🌲 技能树' : '🏆 成就墙'}
            </button>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="header-button"
            >
              📊 {showStatistics ? '隐藏统计' : '显示统计'}
            </button>
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="header-button"
            >
              🔄 {showImportExport ? '隐藏数据工具' : '数据工具'}
            </button>
          </div>
        </div>

        {/* 账号 / 同步状态条；演示模式下显示模式提示，不显示账号与登出 */}
        <div className="storage-info">
          {IS_DEMO_MODE ? (
            <div className="storage-item">
              <span className="storage-label">🎪 演示模式:</span>
              <span className="storage-value">数据仅保存在本设备，登录功能暂时关闭</span>
            </div>
          ) : (
            <>
              <div className="storage-item">
                <span className="storage-label">👤 账号:</span>
                <span className="storage-value">{username}</span>
              </div>
              <div className="storage-item">
                <span className="storage-label">🔄 状态:</span>
                <span className="storage-value">{SYNC_LABEL[syncState] || syncState}</span>
              </div>
            </>
          )}
          <button onClick={reload} className="refresh-button" title="重新加载数据">🔄</button>
          {!IS_DEMO_MODE && (
            <button onClick={logout} className="refresh-button" title="退出登录">🚪</button>
          )}
        </div>

        {/* 统计面板 */}
        {showStatistics && (
          <StatisticsPanel
            statistics={statistics}
            tags={TAGS}
            onClose={() => setShowStatistics(false)}
          />
        )}

        {/* 导入导出面板 */}
        {showImportExport && (
          <ImportExportPanel
            onClose={() => setShowImportExport(false)}
            onExport={exportData}
            onImport={importData}
            onClear={clearAllAchievements}
            onLogout={logout}
            achievementsCount={achievements.length}
          />
        )}
      </header>

      <main className="app-main">
        {view === 'tree' ? (
          <section className="achievements-section">
            <TreePanel
              achievements={achievements}
              onAdd={addAchievement}
              onDelete={deleteAchievement}
              onLightUp={(id, target) => updateAchievement(id, { currentValue: target })}
              onMoveCard={(id, parentId) => updateAchievement(id, { parentId })}
              isLoading={isLoading}
            />
          </section>
        ) : (
          <>
            <aside className="sidebar">
              <AddAchievementForm
                onAddAchievement={addAchievement}
                tags={TAGS}
                disabled={isLoading}
              />
              <div className="control-panel">
                <h3>⚙️ 控制面板</h3>
                <div className="control-buttons">
                  <button onClick={addExampleAchievement} className="control-button secondary" disabled={isLoading}>
                    + 添加示例数据
                  </button>
                  <button onClick={() => setShowStatistics(true)} className="control-button secondary">
                    📊 查看统计
                  </button>
                  <button onClick={() => setShowImportExport(true)} className="control-button secondary">
                    🔄 数据管理
                  </button>
                </div>
              </div>
            </aside>

            <section className="achievements-section">
              <div className="section-header">
                <h2>🏆 我的成就墙</h2>
                <p className="section-subtitle">
                  共 {wallCards.length} 个成就 • 按创建时间排序
                </p>
              </div>

              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner large"></div>
                  <p>正在加载成就数据...</p>
                </div>
              ) : wallCards.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>还没有任何成就记录</h3>
                  <button onClick={addExampleAchievement} className="example-button">
                    + 添加示例成就
                  </button>
                </div>
              ) : (
                <div className="achievements-grid">
                  {wallCards.map((achievement) => (
                    <Card
                      key={achievement.id}
                      achievement={achievement}
                      onDelete={deleteAchievement}
                      onUpdate={updateAchievement}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          成长图谱{IS_DEMO_MODE ? ' · 演示模式（本地数据）' : ' · 数据已接入后端，登录后实时同步'}
        </p>
      </footer>
    </div>
  );
}

export default App;
