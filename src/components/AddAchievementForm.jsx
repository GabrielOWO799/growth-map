// src/components/AddAchievementForm.jsx
// 添加成就表单（样式已抽离到 AddAchievementForm.css，逻辑与旧版完全一致）
import { useState, useEffect } from 'react';
import { toast } from '../toast';
import { compressImage } from '../utils/image';
import './AddAchievementForm.css';

function AddAchievementForm({ onAddAchievement, tags, disabled = false }) {
  // 表单状态（一个对象管理所有表单字段；kind=card 成就卡 / task 任务卡）
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    tag: '学习',
    kind: 'card',
    dueDate: ''
  });

  // 在组件顶层声明防抖状态
  const [debouncedTitle, setDebouncedTitle] = useState('');

  // 在组件顶层声明上传状态
  const [isUploading, setIsUploading] = useState(false);

  // 在组件顶层使用useEffect处理防抖逻辑
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(formData.title);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.title]); // 依赖formData.title，当标题变化时重新设置定时器

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,    // 保留其他字段
      [name]: value   // 更新当前字段
    });
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为

    if (disabled) {
      toast('正在加载数据，请稍候再试');
      return;
    }

    // 验证：标题不能为空
    if (!formData.title.trim()) {
      toast('请输入成就标题', 'error');
      return;
    }

    // 设置上传状态（仅在实际请求期间，不再用 setTimeout 假延迟）
    setIsUploading(true);

    try {
      // 创建新的成就对象（id/imageUrl/date 仅用于本地预览，真正入库由后端生成）
      const newAchievement = {
        title: formData.title,
        description: formData.description,
        tag: formData.tag,
        kind: formData.kind,
        dueDate: formData.kind === 'task' && formData.dueDate ? formData.dueDate : null,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD格式
      };
      if (formData.kind === 'card') {
        newAchievement.imageUrl = formData.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&auto=format';
      }

      // 调用父组件传递的回调（已接通后端 API，真正发起请求）
      if (onAddAchievement) {
        await onAddAchievement(newAchievement);
      }

      // 重置表单
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        tag: formData.tag,
        kind: formData.kind,
        dueDate: ''
      });

      toast(formData.kind === 'task' ? '任务已创建 ✓' : '成就已保存 ✓', 'success');
    } catch (err) {
      // 捕获后端/网络错误，避免静默失败
      toast('保存失败：' + (err && err.message ? err.message : '未知错误'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const locked = isUploading || disabled;
  const activeTag = tags.find((t) => t.name === formData.tag);

  return (
    <div className="aaf-panel">
      <h2 className="aaf-title">🎯 添加新成就</h2>

      {/* 类型切换：成就卡 / 任务卡 */}
      <div className="aaf-kind-row">
        <button
          type="button"
          className={`aaf-kind-btn ${formData.kind === 'card' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, kind: 'card' })}
          disabled={locked}
        >
          🎖️ 成就卡<span className="aaf-kind-sub">已完成的事</span>
        </button>
        <button
          type="button"
          className={`aaf-kind-btn ${formData.kind === 'task' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, kind: 'task' })}
          disabled={locked}
        >
          ⏰ 任务卡<span className="aaf-kind-sub">要做的事 · 可设截止</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 成就标题 */}
        <div className="aaf-field">
          <label className="aaf-label">成就标题 *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="例如：完成React学习第一章"
            className="aaf-input"
            required
            disabled={locked}
          />
          {/* 防抖效果提示 */}
          {formData.title !== debouncedTitle && debouncedTitle && (
            <small className="aaf-hint">实时预览将在输入停止后更新...</small>
          )}
        </div>

        {/* 详细描述 */}
        <div className="aaf-field">
          <label className="aaf-label">详细描述</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="描述你完成的具体内容、感受或收获..."
            className="aaf-textarea"
            disabled={locked}
          />
        </div>

        {/* 卡面图片（本地选择，前端自动压缩） */}
        {formData.kind === 'card' && (
          <div className="aaf-field">
            <label className="aaf-label">卡面图片（可选，自动压缩）</label>
            <div className="aaf-file-row">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="已选图片" className="aaf-file-thumb" />
              ) : (
                <div className="aaf-file-thumb aaf-file-empty">🖼️</div>
              )}
              <label className="aaf-file-btn">
                📷 {formData.imageUrl ? '重新选择' : '选择本地图片'}
                <input
                  type="file"
                  accept="image/*"
                  className="aaf-file-input"
                  disabled={locked}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const dataUrl = await compressImage(file);
                      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
                    } catch (err) {
                      toast(err.message || '图片处理失败', 'error');
                    }
                    e.target.value = ''; // 允许重复选择同一文件
                  }}
                />
              </label>
              {formData.imageUrl && (
                <button
                  type="button"
                  className="aaf-file-clear"
                  disabled={locked}
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                >
                  ✕ 清除
                </button>
              )}
            </div>
          </div>
        )}

        {/* 截止日期（仅任务卡） */}
        {formData.kind === 'task' && (
          <div className="aaf-field">
            <label className="aaf-label">截止日期（可选）</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="aaf-input"
              disabled={locked}
            />
          </div>
        )}

        {/* 标签选择 */}
        <div className="aaf-field aaf-field-tags">
          <label className="aaf-label">选择标签</label>
          <div className="aaf-tags">
            {tags.map((tagItem) => {
              const selected = formData.tag === tagItem.name;
              return (
                <div
                  key={tagItem.id}
                  onClick={() => {
                    if (!locked) setFormData({ ...formData, tag: tagItem.name });
                  }}
                  className={`aaf-tag ${selected ? 'selected' : ''} ${locked ? 'disabled' : ''}`}
                  style={selected ? { borderColor: tagItem.color, backgroundColor: `${tagItem.color}18`, color: tagItem.color } : undefined}
                >
                  <span>{tagItem.emoji}</span>
                  <span>{tagItem.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className="btn btn-primary aaf-submit"
          disabled={locked}
        >
          {isUploading
            ? '⏳ 上传中...'
            : disabled
              ? '⏳ 加载中...'
              : formData.kind === 'task'
                ? '⏰ 创建任务'
                : '💾 保存成就'}
        </button>
      </form>

      {/* 实时预览 */}
      {(formData.title || debouncedTitle) && (
        <div className="aaf-preview">
          <h3>
            📝 实时预览 {formData.title !== debouncedTitle && '(防抖中...)'}
          </h3>
          <div className="aaf-preview-body">
            {formData.imageUrl ? (
              <img
                src={formData.imageUrl}
                alt="预览"
                className="aaf-preview-img"
              />
            ) : (
              <div className="aaf-preview-placeholder">图片</div>
            )}
            <div className="aaf-preview-info">
              <span
                className="aaf-preview-tag"
                style={{
                  backgroundColor: activeTag ? `${activeTag.color}18` : 'var(--surface)',
                  color: activeTag ? activeTag.color : 'var(--muted)',
                }}
              >
                {formData.tag}
              </span>
              {/* 使用防抖后的标题进行预览 */}
              <h4 className="aaf-preview-title">{debouncedTitle || formData.title}</h4>
              {formData.description && (
                <p className="aaf-preview-desc">{formData.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddAchievementForm;
