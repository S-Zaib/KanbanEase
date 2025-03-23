import React from 'react';

type LogoProps = {
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-3xl',
    large: 'text-5xl'
  }

  return (
    <div className="flex items-center">
      <span className={`${sizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600`}>
        KanbanEase
      </span>
    </div>
  )
} 