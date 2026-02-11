// src/components/ImportExportPanel.jsx
import { useState } from 'react';

function ImportExportPanel({ onClose, onExport, onImport, onClear, achievementsCount }) {
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    try {
      const data = onExport();
      
      // 创建下载链接
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth-map-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('导出成功！文件已开始下载');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请检查控制台');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setImportError('请输入要导入的JSON数据');
      return;
    }

    try {
      setIsImporting(true);
      setImportError('');
      
      await onImport(importData);
      setImportData('');
      alert('导入成功！');
      onClose();
    } catch (error) {
      setImportError(`导入失败: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImportData(e.target.result);
    };
    reader.onerror = () => {
      setImportError('读取文件失败');
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm(`确定要清空所有 ${achievementsCount} 个成就吗？此操作不可恢复！`)) {
      onClear();
      onClose();
      alert('已清空所有成就');
    }
  };

  return (
    <div className="import-export-panel">
      <div className="panel-header">
        <h3>🔄 数据管理</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="panel-content">
        {/* 导出部分 */}
        <div className="export-section">
          <h4>📤 导出数据</h4>
          <p className="section-description">
            将成就数据导出为JSON文件，可用于备份或迁移
          </p>
          <button 
            onClick={handleExport}
            className="action-button primary"
            disabled={achievementsCount === 0}
          >
            💾 导出JSON文件
          </button>
          <div className="info-text">
            当前有 {achievementsCount} 个成就可导出
          </div>
        </div>

        {/* 导入部分 */}
        <div className="import-section">
          <h4>📥 导入数据</h4>
          <p className="section-description">
            从JSON文件导入成就数据（将替换现有数据）
          </p>
          
          <div className="import-options">
            <div className="file-import">
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="file-input"
                />
                📁 选择JSON文件
              </label>
            </div>
            
            <div className="or-divider">
              <span>或</span>
            </div>
            
            <div className="text-import">
              <label>直接粘贴JSON数据：</label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='{"achievements": [...], "exportDate": "..."}'
                className="import-textarea"
                rows={6}
              />
            </div>
          </div>

          {importError && (
            <div className="error-message">
              ⚠️ {importError}
            </div>
          )}

          <button 
            onClick={handleImport}
            className="action-button secondary"
            disabled={!importData.trim() || isImporting}
          >
            {isImporting ? '⏳ 导入中...' : '📥 导入数据'}
          </button>

          <div className="warning-box">
            ⚠️ 注意：导入会替换现有数据，建议先导出备份
          </div>
        </div>

        {/* 数据管理 */}
        <div className="management-section">
          <h4>🗑️ 数据管理</h4>
          <div className="management-actions">
            <button 
              onClick={handleClear}
              className="action-button danger"
              disabled={achievementsCount === 0}
            >
              🗑️ 清空所有成就 ({achievementsCount})
            </button>
            
            <button 
              onClick={() => {
                localStorage.clear();
                alert('已清空所有本地存储数据，页面将刷新');
                window.location.reload();
              }}
              className="action-button warning"
            >
              🔥 清除所有本地存储
            </button>
          </div>
          
          <div className="warning-box danger">
            ⚠️ 危险操作：这些操作不可恢复，请谨慎使用
          </div>
        </div>

        {/* 备份信息 */}
        <div className="backup-info">
          <h4>💾 备份信息</h4>
          <ul>
            <li>数据自动保存到浏览器本地存储</li>
            <li>建议定期导出备份</li>
            <li>更换浏览器或设备时需要手动迁移数据</li>
            <li>隐私模式下数据可能不会被保存</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ImportExportPanel;