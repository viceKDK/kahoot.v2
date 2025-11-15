// ============================================================================
// AVATAR COMPONENT
// Muestra el avatar del jugador con emoji y color
// ============================================================================

import { Avatar as AvatarType } from '@/shared/types';

interface AvatarProps {
  avatar: AvatarType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12 text-xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-24 h-24 text-5xl',
  xl: 'w-32 h-32 text-6xl',
};

export default function Avatar({ avatar, size = 'md', showBorder = true }: AvatarProps) {
  return (
    <div
      className={`
        rounded-full flex items-center justify-center shadow-lg
        ${sizeClasses[size]}
        ${showBorder ? 'border-4 border-white' : ''}
      `}
      style={{ backgroundColor: avatar.color }}
    >
      <span className="select-none">{avatar.emoji}</span>
    </div>
  );
}
