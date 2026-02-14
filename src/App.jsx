// src/App.jsx
import { useState } from 'react';
import Card from './components/Card';
import AddAchievementForm from './components/AddAchievementForm';
import StatisticsPanel from './components/StatisticsPanel'; // 新增
import ImportExportPanel from './components/ImportExportPanel'; // 新增
import { TAGS } from './constants/tags';
import useAchievements from './hooks/useAchievements';
import {useCallback} from 'react';
import SkeletonCard from './components/SkeletonCard';
import './App.css';


function App() {
  // 使用自定义Hook管理成就数据

  // 本地状态：是否显示统计面板
  const [showStatistics, setShowStatistics] = useState(false);
  
  // 本地状态：是否显示导入导出面板
  const [showImportExport, setShowImportExport] = useState(false);
  
  // 获取统计信息
  const { getStatistics } = useAchievements(); // ✅ 从 Hook 中解构
  const statistics = getStatistics(); // ✅ 现在可以调用

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  fetchAchievements()
    .then(res => setAchievements(res.data))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);

const handleUpload = async (newAchievement) => {
  try {
    const res = await createAchievement(newAchievement);
    setAchievements(prev => [...prev, res.data]);
  } catch (err) {
    setError(err.message);
  }
};
  
  // 添加示例数据的函数
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
      {/* 头部 */}
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
        
        {/* 加载状态指示 */}
        {isLoading ? (
          <div className="loading-indicator">
            <div className="skeleton-grid">
              {[...Array(6).map((_,index)=>(
                <SkeletonCard key={index} />
              ))]}
            </div>
            <p>正在加载成就数据...</p>
          </div>
        ) : (
          <>
            {/* 存储信息 */}
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
              <button 
                onClick={reload}
                className="refresh-button"
                title="重新加载数据"
              >
                🔄
              </button>
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
          </>
        )}
      </header>
      
      <main className="app-main">
        {/* 左侧：表单和控制面板 */}
        <aside className="sidebar">
          <AddAchievementForm 
            onAddAchievement={addAchievement}
            tags={TAGS}
            disabled={isLoading}
          />
          
          {/* 控制面板 */}
          <div className="control-panel">
            <h3>⚙️ 控制面板</h3>
            
            <div className="control-buttons">
              <button 
                onClick={addExampleAchievement}
                className="control-button secondary"
                disabled={isLoading}
              >
                + 添加示例数据
              </button>
              
              <button 
                onClick={() => setShowStatistics(true)}
                className="control-button secondary"
              >
                📊 查看统计
              </button>
              
              <button 
                onClick={() => setShowImportExport(true)}
                className="control-button secondary"
              >
                🔄 数据管理
              </button>
            </div>
            
            <div className="learning-tip">
              <h4>📚 Day 5 学习要点</h4>
              <ul>
                <li><strong>自定义Hook</strong>：提取可复用的逻辑</li>
                <li><strong>代码重构</strong>：关注点分离，提高可维护性</li>
                <li><strong>模块化</strong>：将功能拆分成独立模块</li>
                <li><strong>常量管理</strong>：集中管理配置数据</li>
              </ul>
            </div>
          </div>
        </aside>
        
        {/* 右侧：成就展示 */}
        <section className="achievements-section">
          <div className="section-header">
            <div>
              <h2>🏆 我的成就墙</h2>
              <p className="section-subtitle">
                共 {achievements.length} 个成就 • 
                按创建时间排序 • 
                <span className="tag-count">
                  {Object.keys(statistics.byTag || {}).length} 个标签分类
                </span>
              </p>
            </div>
            
            <div className="section-controls">
              {achievements.length > 0 && (
                <>
                  <button 
                    onClick={() => {
                      const tag = prompt('输入要筛选的标签（学习/健身/工作/生活）：');
                      if (tag) {
                        // 这里可以添加筛选功能
                        alert(`筛选标签: ${tag}（功能待完善）`);
                      }
                    }}
                    className="control-button small"
                  >
                    🔍 筛选
                  </button>
                  
                  <button 
                    onClick={() => {
                      const sorted = [...achievements].sort((a, b) => 
                        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
                      );
                      // 这里可以添加排序功能
                      alert('已按创建时间排序');
                    }}
                    className="control-button small"
                  >
                    ⏱️ 排序
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* 内容区域 */}
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner large"></div>
              <p>正在加载成就数据，请稍候...</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>还没有任何成就记录</h3>
              <p>开始记录你的第一个成就，或者添加示例数据</p>
              <button 
                onClick={addExampleAchievement}
                className="example-button"
              >
                + 添加示例成就
              </button>
            </div>
          ) : (
            <>
              {/* 标签分布统计 */}
              <div className="tag-distribution">
                {Object.entries(statistics.byTag || {}).map(([tag, count]) => (
                  <div key={tag} className="tag-item">
                    <span className="tag-emoji">
                      {TAGS.find(t => t.name === tag)?.emoji || '📌'}
                    </span>
                    <span className="tag-name">{tag}</span>
                    <span className="tag-count">{count}</span>
                  </div>
                ))}
              </div>
              
              {/* 成就网格 */}
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <Card 
                    key={achievement.id}
                    achievement={achievement}
                    onDelete={deleteAchievement}
                    onUpdate={updateAchievement}
                  />
                ))}
              </div>
             
            </>
          )}
        </section>
      </main>
    
      
      {/* 页脚 */}
      <footer className="app-footer">
        <p>成长图谱 · Day 6 进度 · 已重构为模块化架构 · 使用自定义Hook管理数据</p>
        <p className="footer-tip">
          💡 提示：数据自动保存到本地存储 · 自定义Hook使代码更清晰 · 可尝试刷新页面验证数据持久化
        </p>
      </footer>
    </div>
  );
}

export default App;