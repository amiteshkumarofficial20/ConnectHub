import { UserAvatar } from '@/components/UserAvatar';
import type { User, MessageWithSender } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListItemProps {
  user: User;
  lastMessage?: MessageWithSender;
  isOnline: boolean;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export function ConversationListItem({
  user,
  lastMessage,
  isOnline,
  isActive,
  unreadCount = 0,
  onClick,
}: ConversationListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 cursor-pointer hover-elevate rounded-lg ${
        isActive ? 'bg-sidebar-accent' : ''
      }`}
      data-testid={`conversation-${user.id}`}
    >
      <UserAvatar user={user} size="lg" showOnlineStatus isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-foreground' : ''}`}>
            {user.name}
          </p>
          {lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
            {lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span
              className="bg-primary text-primary-foreground text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2"
              data-testid={`unread-count-${user.id}`}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
