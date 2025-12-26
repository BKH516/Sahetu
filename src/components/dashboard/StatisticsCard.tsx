import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatisticsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string; 
  trend?: number;
  onClick?: () => void;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ 
  icon, 
  label, 
  value, 
  color = 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  trend,
  onClick
}) => {
  // Extract color classes for different uses
  const isGradient = color.includes('from-') && color.includes('to-');
  const bgColor = isGradient ? '' : color.split(' ').find(c => c.startsWith('bg-')) || 'bg-primary/10';
  const textColor = isGradient ? '' : color.split(' ').find(c => c.startsWith('text-') && !c.includes('dark:')) || 'text-primary';
  const darkTextColor = isGradient ? '' : color.split(' ').find(c => c.includes('dark:text-')) || 'dark:text-primary-light';
  
  // For icon background, extract base color and make it vibrant
  let iconBgClass = 'bg-primary';
  if (isGradient) {
    iconBgClass = `bg-gradient-to-br ${color}`;
  } else {
    // Extract the color name from bg- classes (handles bg-primary, bg-yellow-100, bg-primary/10, etc.)
    const colorMatch = bgColor.match(/bg-([a-z]+(?:-\d+)?)(?:\/\d+)?/);
    if (colorMatch) {
      const colorName = colorMatch[1];
      // Map to vibrant versions - extract base color name
      const baseColor = colorName.split('-')[0];
      const colorMap: Record<string, string> = {
        'primary': 'bg-primary',
        'yellow': 'bg-yellow-500',
        'green': 'bg-green-500',
        'blue': 'bg-blue-500',
        'red': 'bg-red-500',
        'purple': 'bg-purple-500',
        'indigo': 'bg-indigo-500',
        'pink': 'bg-pink-500',
        'cyan': 'bg-cyan-500',
        'teal': 'bg-teal-500',
        'orange': 'bg-orange-500',
        'amber': 'bg-amber-500',
        'emerald': 'bg-emerald-500',
        'violet': 'bg-violet-500',
        'fuchsia': 'bg-fuchsia-500',
        'rose': 'bg-rose-500',
        'sky': 'bg-sky-500',
        'lime': 'bg-lime-500',
      };
      iconBgClass = colorMap[baseColor] || `bg-${baseColor}-500`;
    }
  }
  
  // For background decoration
  const decorationBgClass = isGradient 
    ? `bg-gradient-to-br ${color}` 
    : bgColor || 'bg-primary/10';

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {/* Background Decoration */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 ${decorationBgClass} opacity-10 dark:opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`}
      ></div>
      
      {/* Content */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 truncate">
            {label}
          </p>
          <p className={`text-3xl font-bold ${textColor} ${darkTextColor} mb-1 group-hover:scale-105 transition-transform duration-300`}>
            {value}
          </p>
          
          {/* Trend Indicator */}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        {/* Icon Container */}
        <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl ${iconBgClass} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <div className="text-white dark:text-white [&>svg]:w-6 [&>svg]:h-6">
            {icon}
          </div>
        </div>
      </div>

      {/* Hover Effect Line */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-1 ${decorationBgClass} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right`}
      ></div>
    </div>
  );
};

export default StatisticsCard; 
