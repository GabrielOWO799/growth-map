// src/components/LazyImage.jsx
import { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt, className = '' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);
  
  // 观察图片是否进入可视区域
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // 看到后就不再观察
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);
  
  // 当图片可见时，开始加载
  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoaded(true);
      };
    }
  }, [isVisible, src]);

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
    >
      {/* 加载中的占位符 */}
      {!isLoaded && (
        <div className="image-placeholder">
          <div className="placeholder-spinner"></div>
        </div>
      )}
      
      {/* 加载完成的图片 */}
      {isLoaded && (
        <img 
          src={src} 
          alt={alt} 
          className="image-content"
        />
      )}
      
      {/* 即使浏览器不支持IntersectionObserver，也用原生懒加载 */}
      <img
        ref={imgRef}
        src={isVisible ? src : ''}
        alt={alt}
        loading="lazy"
        className="image-fallback"
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default LazyImage;