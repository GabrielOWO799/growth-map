// src/components/Card.jsx
import { getTagColor, getTagEmoji } from '../constants/tags';
import {useState,memo}from 'react';
import LazyImage from './LazyImage';


const Card=memo(function Card({ achievement, onDelete, onUpdate }) {
  const { id, title, description, imageUrl, tag, date, createdAt } = achievement;
  
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title,
    description,
    tag
  });

  const tagColor = getTagColor(tag);
  const tagEmoji = getTagEmoji(tag);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(id, editData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ title, description, tag });
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
            
            <div className="edit-tags">
              {['学习', '健身', '工作', '生活', '创作', '社交'].map((tagOption) => (
                <button
                  key={tagOption}
                  onClick={() => setEditData({ ...editData, tag: tagOption })}
                  className={`tag-option ${editData.tag === tagOption ? 'selected' : ''}`}
                  style={{
                    backgroundColor: editData.tag === tagOption ? `${getTagColor(tagOption)}20` : '#f0f0f0',
                    color: editData.tag === tagOption ? getTagColor(tagOption) : '#666'
                  }}
                >
                  {getTagEmoji(tagOption)} {tagOption}
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