// src/components/Card.jsx
import { getTagColor, getTagEmoji, TAGS } from '../constants/tags';
import {useState,memo}from 'react';
import LazyImage from './LazyImage';


const Card=memo(function Card({ achievement, onDelete, onUpdate }) {
  const { id, title, description, imageUrl, tag, date, createdAt, currentValue, targetValue } = achievement;
  
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title,
    description,
    tag,
    currentValue: currentValue || 0
  });

  const tagColor = getTagColor(tag);
  const tagEmoji = getTagEmoji(tag);

  const handleSave = async () => {
    // 一次请求带上标题/描述/标签/进度：updateAchievement 走局部更新，不会重置其他字段
    if (onUpdate) {
      try {
        await onUpdate(id, editData);
      } catch (e) {
        // 后端校验不通过（如进度超目标）或网络错误：留在编辑态提示，避免改动被静默丢弃
        alert('保存失败：' + (e && e.message ? e.message : '未知错误'));
        return;
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ title, description, tag, currentValue: currentValue || 0 });
    setIsEditing(false);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString || dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formattedDate = formatDate(createdAt || date);
  


  return (
    <div 
      className={`achievement-card ${isEditing ? 'editing' : ''}`}
      onClick={() => !isEditing && setShowDetails(!showDetails)}
    >
      {/* 顶部：标签和操作按钮 */}
      <div className="card-header">
        <div 
          className="tag-badge"
          style={{ backgroundColor: `${tagColor}20`, color: tagColor }}
        >
          <span className="tag-emoji">{tagEmoji}</span>
          <span className="tag-name">{tag}</span>
        </div>
        
        <div className="card-actions">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="action-button edit-button"
            title="编辑"
          >
            ✏️
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(id);
            }}
            className="action-button delete-button"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* 图片 */}
      {imageUrl && (
        <div className="card-image">
          <LazyImage
            src={imageUrl}
            alt={title}
            className='card-image-content'
          />
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="card-content">
        {isEditing ? (
          // 编辑模式
          <div className="edit-form">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="edit-input"
              placeholder="成就标题"
            />
            
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="edit-textarea"
              placeholder="详细描述"
              rows={3}
            />

            {/* 进度输入：对应后端 current_value，钳在 [0, 目标值] 区间（后端会拒绝超目标的进度） */}
            <input
              type="number"
              min="0"
              max={targetValue}
              value={editData.currentValue}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  currentValue: Math.max(0, Math.min(Number(e.target.value) || 0, targetValue)),
                })
              }
              className="edit-input"
              placeholder={`当前进度（0 - ${targetValue}）`}
            />
            
            <div className="edit-tags">
              {TAGS.map((tagOption) => (
                <button
                  key={tagOption.name}
                  onClick={() => setEditData({ ...editData, tag: tagOption.name })}
                  className={`tag-option ${editData.tag === tagOption.name ? 'selected' : ''}`}
                  style={{
                    backgroundColor: editData.tag === tagOption.name ? `${getTagColor(tagOption.name)}20` : '#f0f0f0',
                    color: editData.tag === tagOption.name ? getTagColor(tagOption.name) : '#666'
                  }}
                >
                  {getTagEmoji(tagOption.name)} {tagOption.name}
                </button>
              ))}
            </div>
            
            <div className="edit-actions">
              <button onClick={handleSave} className="save-button">
                💾 保存
              </button>
              <button onClick={handleCancel} className="cancel-button">
                ❌ 取消
              </button>
            </div>
          </div>
        ) : (
          // 查看模式
          <>
            <h3 className="card-title">{title}</h3>
            
            <div className="card-meta">
              <span className="card-date" title="创建时间">
                📅 {formattedDate}
              </span>
              <span className="card-id">
                #{id.toString().padStart(3, '0')}
              </span>
            </div>

            {typeof currentValue === 'number' && (
              <div className="card-progress" title="当前进度">
                📈 进度 {currentValue}
              </div>
            )}
            
            {showDetails && description && (
              <div className="card-description">
                <p>{description}</p>
              </div>
            )}
            
            <div className="card-footer">
              <span className="view-hint">
                {showDetails ? '👆 点击收起详情' : '👇 点击查看详情'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default Card;
