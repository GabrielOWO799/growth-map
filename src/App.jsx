import { useState } from 'react';
import Card from './components/Card';
import AddAchievementForm from './components/AddAchievementForm';
import StatisticsPanel from './components/StatisticsPanel';
import ImportExportPanel from './components/ImportExportPanel';
import { TAGS } from './constants/tags';
import useAchievements from './hooks/useAchievements';
import SkeletonCard from './components/SkeletonCard';
import './App.css';

function App() {
  // 从自定义 Hook 获取所有数据和方法
  const {
    achievements,
    isLoading,
    storageInfo,
    reload,
    addAchievement,
    deleteAchievement,
    updateAchievement,
    clearAllAchievements,
    exportData,
    importData,
    getStatistics
  } = useAchievements();

  // 本地 UI 状态
  const [showStatistics, setShowStatistics] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // 获取统计信息
  const statistics = getStatistics();

  // 添加示例数据
  const addExampleAchievement = () => {
    const exampleAchievements = [
      {
        title: '学习自定义Hook',
        description: '成功创建了第一个自定义Hook，理解了逻辑复用的重要性',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
        tag: '学习'
      },
      {
        title: '代码重构完成',
        description: '将项目重构为模块化结构，提高了代码可维护性',
        imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=250&fit=crop',
        tag: '工作'
      },
      {
        title: '冥想15分钟',
        description: '坚持每日冥想，感觉更加专注和平静',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
        tag: '生活'
      }
    ];
    exampleAchievements.forEach(achievement => {
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

        {/* 存储信息条 */}
        <div className="storage-info">
          <div className="storage-item">
            <span className="storage-label">📊 总数:</span>
            <span className="storage-value">{statistics.total}</span>
          </div>
          <div className="storage-item">
            <span className="storage-label">💾 存储:</span>
            <span className="storage-value">
              {storageInfo.size ? `${Math.round(storageInfo.size / 1024 * 100) / 100} KB` : '无数据'}
            </span>
          </div>
          <div className="storage-item">
            <span className="storage-label">🔄 状态:</span>
            <span className="storage-value">{storageInfo.hasData ? '已保存' : '未保存'}</span>
          </div>
          <button onClick={reload} className="refresh-button" title="重新加载数据">🔄</button>
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
            achievementsCount={achievements.length}
          />
        )}
      </header>

      <main className="app-main">
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
              共 {achievements.length} 个成就 • 按创建时间排序
            </p>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner large"></div>
              <p>正在加载成就数据...</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>还没有任何成就记录</h3>
              <button onClick={addExampleAchievement} className="example-button">
                + 添加示例成就
              </button>
            </div>
          ) : (
            <div className="achievements-grid">
              {achievements.map(achievement => (
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
      </main>

      <footer className="app-footer">
        <p>成长图谱 · 使用自定义Hook管理数据 · 数据自动保存到本地</p>
      </footer>
    </div>
  );
}

export default App;