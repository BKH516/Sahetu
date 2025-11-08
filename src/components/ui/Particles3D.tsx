import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  color: string;
}

const Particles3D: React.FC<{ count?: number }> = React.memo(({ count = 30 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user preference for reduced motion and reduce workload on small screens
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.innerWidth < 768;
    const isMediumScreen = window.innerWidth < 1024;
    // Reduce particles more aggressively for better performance
    const effectiveCount = prefersReducedMotion ? 0 : (
      isSmallScreen ? Math.max(5, Math.floor(count / 3)) : 
      isMediumScreen ? Math.max(10, Math.floor(count / 2)) : 
      Math.min(count, 20) // Cap at 20 for better performance
    );

    if (effectiveCount === 0) {
      // Do not initialize animation if user prefers reduced motion
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    const particles: Particle[] = [];
    const mouse = { x: 0, y: 0 };

    // Create particles
    for (let i = 0; i < effectiveCount; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 200 - 100,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 360,
        color: getRandomColor(),
      });
    }

    function getRandomColor() {
      const colors = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    // Use DocumentFragment for better performance (reduces forced reflow)
    const particleElements: HTMLDivElement[] = [];
    let containerWidth = window.innerWidth;
    let containerHeight = window.innerHeight;
    
    // Cache window dimensions to avoid reflow
    // Use requestAnimationFrame to batch dimension updates
    let dimensionUpdateFrame: number | null = null;
    const updateDimensions = () => {
      if (!isMounted || dimensionUpdateFrame !== null) return;
      
      dimensionUpdateFrame = requestAnimationFrame(() => {
        if (!isMounted) {
          dimensionUpdateFrame = null;
          return;
        }
        // Batch read window dimensions (minimize forced reflow)
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
        dimensionUpdateFrame = null;
      });
    };
    
    function updateParticles() {
      if (!isMounted || !container || !container.isConnected) return;

      // Create elements only once, then update them
      if (particleElements.length === 0) {
        const fragment = document.createDocumentFragment();
        particles.forEach(() => {
          const div = document.createElement('div');
          div.className = 'particle';
          div.style.position = 'absolute';
          div.style.width = '4px';
          div.style.height = '4px';
          div.style.borderRadius = '50%';
          div.style.willChange = 'transform';
          div.style.pointerEvents = 'none';
          fragment.appendChild(div);
          particleElements.push(div);
        });
        container.appendChild(fragment);
      }

      // Batch DOM updates to reduce reflow
      // Update all particles in one pass to minimize layout thrashing
      particles.forEach((particle, index) => {
        const element = particleElements[index];
        if (!element || !element.isConnected) return;
        
        const x = particle.x + mouse.x * 0.01;
        const y = particle.y + mouse.y * 0.01;
        
        // Use transform only to avoid layout recalculation (composite layer)
        const xPx = (x / 100) * containerWidth;
        const yPx = (y / 100) * containerHeight;
        
        // Update transform (most frequent change, triggers composite layer)
        element.style.transform = `translate3d(${xPx}px, ${yPx}px, ${particle.z}px)`;
        
        // Only update other properties if they actually changed (optimization)
        // This reduces unnecessary style recalculations
        const newShadow = `0 0 ${Math.abs(particle.z)}px ${particle.color}`;
        if (element.style.boxShadow !== newShadow) {
          element.style.boxShadow = newShadow;
        }
        // Background color rarely changes, so check before updating
        if (element.style.background !== particle.color) {
          element.style.background = particle.color;
        }
      });
    }

    // Debounce and throttle mouse move to reduce reflow
    let mouseMoveFrameId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseMoveFrameId !== null) {
        cancelAnimationFrame(mouseMoveFrameId);
      }
      
      mouseMoveFrameId = requestAnimationFrame(() => {
        if (!isMounted) return;
        mouse.x = (e.clientX / containerWidth - 0.5) * 20;
        mouse.y = (e.clientY / containerHeight - 0.5) * 20;
        // Don't call updateParticles here - let the animation loop handle it
      });
    };

    let animationFrameId: number;
    let lastTime = performance.now();
    const targetFPS = 30; // Reduced from 60 to 30 for better performance
    const frameInterval = 1000 / targetFPS;

    let frameCounter = 0;
    const animateParticles = (currentTime: number) => {
      if (!isMounted) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      const deltaTime = currentTime - lastTime;
      
      // Only update if enough time has passed (throttle to ~30fps for better performance)
      if (deltaTime >= frameInterval) {
        particles.forEach((particle) => {
          particle.z += 0.5;
          if (particle.z > 100) particle.z = -100;
          particle.rx += 0.01;
          particle.ry += 0.01;
        });
        // Update shadows/colors less frequently to reduce style work (every 10 frames instead of 6)
        if (frameCounter % 10 === 0) {
          updateParticles();
        } else {
          // Fast path: update only transforms (most frequent change)
          const elements = container.querySelectorAll<HTMLDivElement>('.particle');
          elements.forEach((element, index) => {
            const particle = particles[index];
            const x = particle.x + mouse.x * 0.01;
            const y = particle.y + mouse.y * 0.01;
            const xPx = (x / 100) * containerWidth;
            const yPx = (y / 100) * containerHeight;
            element.style.transform = `translate3d(${xPx}px, ${yPx}px, ${particle.z}px)`;
          });
        }
        frameCounter++;
        lastTime = currentTime - (deltaTime % frameInterval);
      }
      
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    // Initialize dimensions (only once at start)
    containerWidth = window.innerWidth;
    containerHeight = window.innerHeight;
    updateParticles();
    
    // Throttled resize handler to reduce forced reflow
    let resizeTimeout: NodeJS.Timeout | null = null;
    const resizeHandler = () => {
      if (!isMounted) return;
      
      // Debounce resize events
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        if (isMounted) {
          updateDimensions();
        }
      }, 200); // Debounce resize updates
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', resizeHandler, { passive: true });

    // Use requestAnimationFrame for smoother, more efficient animation
    animationFrameId = requestAnimationFrame(animateParticles);

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(animationFrameId);
      if (mouseMoveFrameId !== null) {
        cancelAnimationFrame(mouseMoveFrameId);
      }
      if (dimensionUpdateFrame !== null) {
        cancelAnimationFrame(dimensionUpdateFrame);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      // Clean up DOM elements
      if (container && particleElements.length > 0) {
        particleElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        particleElements.length = 0;
      }
    };
  }, [count]);

  return (
    <div 
      ref={containerRef} 
      className="particles-container fixed inset-0 pointer-events-none z-0"
    />
  );
});

Particles3D.displayName = 'Particles3D';

export default Particles3D;

