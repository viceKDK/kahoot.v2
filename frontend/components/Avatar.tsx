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
  sm: 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl',
  md: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-xl sm:text-2xl md:text-3xl',
  lg: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-3xl sm:text-4xl md:text-5xl',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-4xl sm:text-5xl md:text-6xl',
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
