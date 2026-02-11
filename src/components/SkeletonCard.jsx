// src/components/SkeletonCard.jsx - 骨架屏组件
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      {/* 标签骨架 */}
      <div className="skeleton skeleton-tag"></div>
      
      {/* 图片骨架 */}
      <div className="skeleton skeleton-image"></div>
      
      {/* 标题骨架 */}
      <div className="skeleton skeleton-title"></div>
      
      {/* 日期骨架 */}
      <div className="skeleton skeleton-date"></div>
      
      {/* 描述骨架（两行） */}
      <div className="skeleton skeleton-description"></div>
      <div className="skeleton skeleton-description short"></div>
      
      {/* 底部骨架 */}
      <div className="skeleton skeleton-footer"></div>
    </div>
  );
}

export default SkeletonCard;