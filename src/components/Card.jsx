// src/components/Card.jsx
// 收藏卡：难度=边框等级（A金/B银/C铜），完成卡金边+角标，进度条可视化
import { getTagColor, getTagEmoji, TAGS } from '../constants/tags';
import { useState, memo } from 'react';
import { toast } from '../toast';
import { compressImage } from '../utils/image';
import LazyImage from './LazyImage';

const Card = memo(function Card({ achievement, onDelete, onUpdate }) {
  const { id, title, description, imageUrl, tag, date, createdAt, currentValue, targetValue, difficulty, kind, dueDate } = achievement;

  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title,
    description,
    tag,
    currentValue: currentValue || 0,
    // 图片编辑语义：undefined=未改动；data URL=更换；null=移除（回落默认图）
    imageData: undefined
  });

  const tagColor = getTagColor(tag);
  const tagEmoji = getTagEmoji(tag);

  // 完成态：进度达到目标（里程碑集齐的派生规则与技能树一致）
  const isDone =
    typeof currentValue === 'number' &&
    typeof targetValue === 'number' &&
    currentValue >= targetValue;
  const progressPct =
    isDone || (typeof targetValue === 'number' && targetValue > 0)
      ? Math.min(100, Math.round(((currentValue || 0) / targetValue) * 100))
      : 0;

  const handleSave = async () => {
    // 一次请求带上标题/描述/标签/进度：updateAchievement 走局部更新，不会重置其他字段
    if (onUpdate) {
      try {
        await onUpdate(id, editData);
      } catch (e) {
        // 后端校验不通过（如进度超目标）或网络错误：留在编辑态提示，避免改动被静默丢弃
        toast('保存失败：' + (e && e.message ? e.message : '未知错误'), 'error');
        return;
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ title, description, tag, currentValue: currentValue || 0, imageData: undefined });
    setIsEditing(false);
  };

  // 编辑态的卡面预览：新选的 data URL > 移除(空) > 原图
  const editImagePreview =
    editData.imageData === null ? null : (editData.imageData || imageUrl);

  const handleEditImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setEditData((prev) => ({ ...prev, imageData: dataUrl }));
    } catch (err) {
      toast(err.message || '图片处理失败', 'error');
    }
    e.target.value = ''; // 允许重复选择同一文件
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formattedDate = formatDate(createdAt || date);

  // 任务卡的截止徽章：温柔提醒，不惩罚——只陈述"还剩/已过期多少天"
  const dueInfo = (() => {
    if (kind !== 'task' || !dueDate) return null;
    const due = new Date(`${dueDate}T23:59:59`);
    if (Number.isNaN(due.getTime())) return null;
    const days = Math.ceil((due - new Date()) / 86400000);
    const dateText = `${due.getMonth() + 1}月${due.getDate()}日`;
    let text;
    if (days < 0) text = `已过期 ${-days} 天`;
    else if (days === 0) text = '今天截止';
    else text = `还剩 ${days} 天`;
    return { text, dateText, cls: days < 0 ? 'overdue' : days <= 2 ? 'soon' : '' };
  })();

  const handleCompleteTask = async () => {
    try {
      await onUpdate(id, { currentValue: targetValue || 1 });
    } catch (e) {
      toast('完成失败：' + (e && e.message ? e.message : '未知错误'), 'error');
    }
  };

  return (
    <div
      className={`achievement-card ${isEditing ? 'editing' : ''} ${kind === 'task' ? 'task' : ''} ${difficulty ? `tier-${difficulty}` : ''} ${isDone ? 'complete' : ''}`}
      onClick={() => !isEditing && setShowDetails(!showDetails)}
    >
      {/* 等级徽章与完成角标（卡框上缘） */}
      {difficulty && <span className="diff-badge">{difficulty}</span>}
      {isDone && <span className="done-flag">✓ 已完成</span>}

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
            {/* 卡面图片编辑：预览 + 更换 + 移除 */}
            <div className="edit-image">
              {editImagePreview ? (
                <img src={editImagePreview} alt="卡面预览" className="edit-image-preview" />
              ) : (
                <div className="edit-image-preview edit-image-removed">🖼️ 将使用默认图</div>
              )}
              <div className="edit-image-actions">
                <label className="edit-image-btn">
                  📷 更换图片
                  <input type="file" accept="image/*" hidden onChange={handleEditImage} />
                </label>
                {editImagePreview && (
                  <button
                    type="button"
                    className="edit-image-btn edit-image-remove"
                    onClick={() => setEditData((prev) => ({ ...prev, imageData: null }))}
                  >
                    ✕ 移除图片
                  </button>
                )}
              </div>
            </div>

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
                    borderColor: editData.tag === tagOption.name ? getTagColor(tagOption.name) : undefined,
                    backgroundColor: editData.tag === tagOption.name ? `${getTagColor(tagOption.name)}18` : undefined,
                    color: editData.tag === tagOption.name ? getTagColor(tagOption.name) : undefined
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

            {/* 进度条：current / target */}
            {typeof currentValue === 'number' && typeof targetValue === 'number' && (
              <div className="card-progress" title="当前进度">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="progress-num">{currentValue}/{targetValue}</span>
              </div>
            )}

            {/* 任务卡的截止提醒 */}
            {dueInfo && (
              <span className={`due-badge ${dueInfo.cls}`} title={`截止日期：${dueInfo.dateText}`}>
                ⏰ {dueInfo.text}
              </span>
            )}

            {showDetails && description && (
              <div className="card-description">
                <p>{description}</p>
              </div>
            )}

            <div className="card-footer">
              {kind === 'task' && !isDone && (
                <button
                  className="task-done-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteTask();
                  }}
                >
                  ✓ 完成
                </button>
              )}
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
