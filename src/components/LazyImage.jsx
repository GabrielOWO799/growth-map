// src/components/LazyImage.jsx
// 卡面图：原生 loading="lazy" + onLoad/onError 状态切换。
// 旧版手写 IntersectionObserver 有 ref 双挂、空 src 请求、无 onError 永远转圈三个问题，已废弃。
import { useState } from 'react';

function LazyImage({ src, alt, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`lazy-image ${className} ${loaded ? 'loaded' : 'loading'}`}>
      {!loaded && !failed && (
        <div className="image-placeholder">
          <div className="placeholder-spinner"></div>
        </div>
      )}

      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="image-content"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}

      {failed && <div className="image-fallback" title="图片加载失败">🖼️</div>}
    </div>
  );
}

export default LazyImage;
