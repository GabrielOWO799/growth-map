// src/components/AddAchievementForm.jsx

import { useState, useEffect } from 'react';

function AddAchievementForm({ onAddAchievement, tags, disabled = false }) {
  // 表单状态（理解：一个对象管理所有表单字段）
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    tag: '学习'
  });
  
  // ✅ 正确：在组件顶层声明防抖状态
  const [debouncedTitle, setDebouncedTitle] = useState('');
  
  // ✅ 正确：在组件顶层声明上传状态
  const [isUploading, setIsUploading] = useState(false);
  
  // ✅ 正确：在组件顶层使用useEffect处理防抖逻辑
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
      alert('正在加载数据，请稍候再试');
      return;
    }
    
    // 验证：标题不能为空
    if (!formData.title.trim()) {
      alert('请输入成就标题');
      return;
    }
    
    // 设置上传状态（仅在实际请求期间，不再用 setTimeout 假延迟）
    setIsUploading(true);

    try {
      // 创建新的成就对象（id/imageUrl/date 仅用于本地预览，真正入库由后端生成）
      const newAchievement = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&auto=format',
        tag: formData.tag,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD格式
      };

      // 调用父组件传递的回调（已接通后端 API，真正发起请求）
      if (onAddAchievement) {
        await onAddAchievement(newAchievement);
      }

      // 重置表单
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        tag: '学习'
      });

      alert('成就添加成功！');
    } catch (err) {
      // 捕获后端/网络错误，避免静默失败
      alert('保存失败：' + (err && err.message ? err.message : '未知错误'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h2 style={{ 
        marginTop: '0', 
        marginBottom: '20px',
        fontSize: '1.5rem',
        color: '#2c3e50'
      }}>
        🎯 添加新成就
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* 成就标题 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#34495e'
          }}>
            成就标题 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="例如：完成React学习第一章"
            style={{ 
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            required
            disabled={isUploading || disabled}
          />
          {/* 防抖效果提示 */}
          {formData.title !== debouncedTitle && debouncedTitle && (
            <small style={{ 
              display: 'block', 
              marginTop: '6px',
              color: '#3498db',
              fontSize: '12px'
            }}>
              实时预览将在输入停止后更新...
            </small>
          )}
        </div>
        
        {/* 详细描述 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#34495e'
          }}>
            详细描述
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="描述你完成的具体内容、感受或收获..."
            style={{ 
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              minHeight: '100px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            disabled={isUploading || disabled}
          />
        </div>
        
        {/* 图片URL */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#34495e'
          }}>
            图片URL（可选）
          </label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="输入图片链接，或留空使用默认图片"
            style={{ 
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            disabled={isUploading || disabled}
          />
        </div>
        
        {/* 标签选择 */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#34495e'
          }}>
            选择标签
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {tags.map((tagItem) => (
              <div
                key={tagItem.id}
                onClick={() => {
                  if (!isUploading && !disabled) {
                    setFormData({ ...formData, tag: tagItem.name });
                  }
                }}
                style={{
                  padding: '10px 16px',
                  border: `2px solid ${formData.tag === tagItem.name ? tagItem.color : '#e0e0e0'}`,
                  borderRadius: '8px',
                  backgroundColor: formData.tag === tagItem.name ? `${tagItem.color}20` : 'white',
                  color: formData.tag === tagItem.name ? tagItem.color : '#555',
                  cursor: (isUploading || disabled) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (isUploading || disabled) ? 0.5 : 1
                }}
              >
                <span>{tagItem.emoji}</span>
                <span>{tagItem.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={disabled || isUploading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: (disabled || isUploading) ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
            opacity: (disabled || isUploading) ? 0.7 : 1
          }}
        >
          {isUploading ? '⏳ 上传中...' : (disabled ? '⏳ 加载中...' : '💾 保存成就')}
        </button>
      </form>
      
      {/* 实时预览 */}
      {(formData.title || debouncedTitle) && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #ddd'
        }}>
          <h3 style={{ marginTop: '0', fontSize: '16px', color: '#555' }}>
            📝 实时预览 {formData.title !== debouncedTitle && '(防抖中...)'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {formData.imageUrl ? (
              <img 
                src={formData.imageUrl} 
                alt="预览"
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                图片
              </div>
            )}
            <div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: tags.find(t => t.name === formData.tag)?.color + '20',
                color: tags.find(t => t.name === formData.tag)?.color,
                marginBottom: '8px'
              }}>
                {formData.tag}
              </div>
              {/* 使用防抖后的标题进行预览 */}
              <h4 style={{ margin: '0 0 5px 0' }}>{debouncedTitle || formData.title}</h4>
              {formData.description && (
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: '#666',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {formData.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddAchievementForm;