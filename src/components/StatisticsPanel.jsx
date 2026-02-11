// src/components/StatisticsPanel.jsx
function StatisticsPanel({ statistics, tags, onClose }) {
  const { total, byTag = {}, last7Days = {} } = statistics;
  
  // 计算标签分布百分比
  const tagDistribution = Object.entries(byTag).map(([tag, count]) => ({
    tag,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    color: tags.find(t => t.name === tag)?.color || '#3498db',
    emoji: tags.find(t => t.name === tag)?.emoji || '📌'
  })).sort((a, b) => b.count - a.count);

  // 准备最近7天数据
  const last7DaysLabels = ['今天', '昨天', '2天前', '3天前', '4天前', '5天前', '6天前'];
  const last7DaysData = last7DaysLabels.map((label, index) => ({
    label,
    count: last7Days[index] || 0
  }));

  return (
    <div className="statistics-panel">
      <div className="panel-header">
        <h3>📊 成就统计</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="statistics-content">
        {/* 概览 */}
        <div className="overview-section">
          <div className="overview-item">
            <div className="overview-value">{total}</div>
            <div className="overview-label">成就总数</div>
          </div>
          <div className="overview-item">
            <div className="overview-value">{Object.keys(byTag).length}</div>
            <div className="overview-label">标签种类</div>
          </div>
          <div className="overview-item">
            <div className="overview-value">
              {last7DaysData.reduce((sum, day) => sum + day.count, 0)}
            </div>
            <div className="overview-label">最近7天</div>
          </div>
        </div>
        
        {/* 标签分布 */}
        <div className="distribution-section">
          <h4>🏷️ 标签分布</h4>
          <div className="tag-distribution-chart">
            {tagDistribution.map(({ tag, count, percentage, color, emoji }) => (
              <div key={tag} className="tag-distribution-item">
                <div className="tag-distribution-header">
                  <span className="tag-emoji">{emoji}</span>
                  <span className="tag-name">{tag}</span>
                  <span className="tag-count">{count} ({percentage}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 最近7天活动 */}
        <div className="recent-activity-section">
          <h4>📅 最近7天活动</h4>
          <div className="activity-chart">
            {last7DaysData.map(({ label, count }) => (
              <div key={label} className="activity-item">
                <div className="activity-label">{label}</div>
                <div className="activity-bar-container">
                  <div 
                    className="activity-bar"
                    style={{ 
                      height: `${Math.min(count * 20, 100)}%`,
                      backgroundColor: count > 0 ? '#2ecc71' : '#e0e0e0'
                    }}
                  />
                </div>
                <div className="activity-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 统计总结 */}
        <div className="summary-section">
          <h4>📈 统计总结</h4>
          <ul className="summary-list">
            <li>
              最常用的标签：{tagDistribution[0]?.tag || '无'} 
              ({tagDistribution[0]?.count || 0}次)
            </li>
            <li>
              平均每天成就数：{total > 0 ? (total / 30).toFixed(1) : 0} 
              (按30天估算)
            </li>
            <li>
              最近活跃度：{last7DaysData.slice(0, 3).reduce((sum, day) => sum + day.count, 0)} 
              个成就 (最近3天)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StatisticsPanel;