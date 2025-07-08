import { useState, useRef, useEffect, memo } from "react";
import { useInView } from "react-intersection-observer";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo(({
  src,
  alt,
  className = "",
  fallback,
  placeholder = "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E",
  onLoad,
  onError
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: "50px"
  });

  useEffect(() => {
    if (inView && imgRef.current && !isLoaded && !hasError) {
      const img = imgRef.current;
      
      const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
      };
      
      const handleError = () => {
        setHasError(true);
        onError?.();
      };
      
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      
      if (img.complete) {
        handleLoad();
      }
      
      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }
  }, [inView, isLoaded, hasError, onLoad, onError]);

  if (hasError && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {inView && (
        <img
          ref={imgRef}
          src={isLoaded ? src : placeholder}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-50'
          } ${className}`}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

LazyImage.displayName = "LazyImage";