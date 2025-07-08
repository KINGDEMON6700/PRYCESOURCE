import { useState, useEffect } from 'react';
import { useThrottle } from './usePerformanceOptimization';

interface UseScrollAnimationOptions {
  threshold?: number;
  offset?: number;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 50, offset = 0 } = options;
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');

  const throttledScrollHandler = useThrottle(() => {
    const currentScrollY = window.scrollY;
    
    setScrollDirection(currentScrollY > scrollY ? 'down' : 'up');
    setScrollY(currentScrollY);
    setIsScrolled(currentScrollY > threshold + offset);
  }, 16); // 60fps

  useEffect(() => {
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [throttledScrollHandler]);

  return {
    scrollY,
    isScrolled,
    scrollDirection,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
    scrollProgress: Math.min(scrollY / 100, 1) // Ajout du scrollProgress pour compatibilité
  };
}