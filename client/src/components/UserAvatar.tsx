import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BadgeCheck } from 'lucide-react';
import type { User } from '@shared/schema';

interface UserAvatarProps {
  user: Pick<User, 'name' | 'profilePicture' | 'isVerified'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showOnlineStatus = false,
  isOnline = false 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
        <AvatarFallback className={`${getAvatarColor(user.name)} text-white`}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
            isOnline ? 'bg-status-online' : 'bg-status-offline'
          }`}
          data-testid={`status-${isOnline ? 'online' : 'offline'}`}
        />
      )}
      {user.isVerified && (
        <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white dark:bg-slate-950 rounded-full" data-testid="badge-verified" />
      )}
    </div>
  );
}
