import React from 'react';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const FloatingElements: React.FC = React.memo(() => {
  const elements: FloatingElement[] = [
    { id: 1, x: 10, y: 20, size: 60, color: 'rgba(59, 130, 246, 0.1)', duration: 4, delay: 0 },
    { id: 2, x: 80, y: 30, size: 40, color: 'rgba(6, 182, 212, 0.1)', duration: 5, delay: 0.5 },
    { id: 3, x: 30, y: 70, size: 80, color: 'rgba(16, 185, 129, 0.1)', duration: 6, delay: 1 },
    { id: 4, x: 70, y: 75, size: 50, color: 'rgba(139, 92, 246, 0.1)', duration: 4.5, delay: 1.5 },
    { id: 5, x: 20, y: 85, size: 70, color: 'rgba(245, 158, 11, 0.1)', duration: 5.5, delay: 2 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute rounded-full blur-3xl floating-element"
          style={{
            width: `${el.size}px`,
            height: `${el.size}px`,
            backgroundColor: el.color,
            left: `${el.x}%`,
            top: `${el.y}%`,
            animation: `float ${el.duration}s ease-in-out infinite`,
            animationDelay: `${el.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

FloatingElements.displayName = 'FloatingElements';

export default FloatingElements;

