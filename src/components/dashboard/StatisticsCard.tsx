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
  color = 'from-cyan-500 to-blue-600',
  trend,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 ${
        onClick ? 'cursor-pointer hover:scale-[1.03]' : ''
      } animate-scale-in`}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {/* Background Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`}></div>
      
      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:scale-105 transition-transform duration-300">
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
        
        {/* Icon */}
        <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <div className="text-white text-2xl">
        {icon}
      </div>
        </div>
      </div>

      {/* Hover Effect Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right`}></div>
    </div>
  );
};

export default StatisticsCard; 
