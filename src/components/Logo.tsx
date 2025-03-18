import React from 'react';

export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const dimensions = {
    small: { width: 32, height: 32, fontSize: 'text-xs', logoText: 'text-sm' },
    medium: { width: 40, height: 40, fontSize: 'text-sm', logoText: 'text-xl' },
    large: { width: 48, height: 48, fontSize: 'text-base', logoText: 'text-2xl' },
  };

  const { width, height, fontSize, logoText } = dimensions[size];

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold`}
        style={{ width, height }}
      >
        <span className={`${fontSize} drop-shadow-md`}>K</span>
      </div>
      <div className="flex flex-col">
        <span className={`${logoText} font-bold text-gray-100 leading-none`}>
          Kanban<span className="text-blue-400">Ease</span>
        </span>
        {size !== 'small' && (
          <span className="text-xs text-gray-400">Seamless Task Management</span>
        )}
      </div>
    </div>
  );
} 