// src/components/Card.jsx
import { getTagColor, getTagEmoji, TAGS } from '../constants/tags';
import {useState,memo}from 'react';
import LazyImage from './LazyImage';


const Card=memo(function Card({ achievement, onDelete, onUpdate, onUpdateProgress }) {
  const { id, title, description, imageUrl, tag, date, createdAt, currentValue } = achievement;
  
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
    if (onUpdate) await onUpdate(id, editData);
    // 进度通过独立接口更新，职责单一、语义清晰
    if (onUpdateProgress) await onUpdateProgress(id, editData.currentValue);
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

            {/* 进度输入：对应后端 current_value */}
            <input
              type="number"
              min="0"
              value={editData.currentValue}
              onChange={(e) => setEditData({ ...editData, currentValue: Number(e.target.value) || 0 })}
              className="edit-input"
              placeholder="当前进度（0 起）"
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
