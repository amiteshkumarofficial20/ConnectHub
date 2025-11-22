import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import type { GroupWithMembers } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface GroupCardProps {
  group: GroupWithMembers;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpen: () => void;
}

export function GroupCard({ group, isMember, onJoin, onLeave, onOpen }: GroupCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6 hover-elevate cursor-pointer" onClick={onOpen} data-testid={`card-group-${group.id}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={group.groupPicture || undefined} alt={group.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(group.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{group.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.membersCount} members
            </span>
            <span>
              Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button
          variant={isMember ? 'outline' : 'default'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            isMember ? onLeave() : onJoin();
          }}
          data-testid={`button-${isMember ? 'leave' : 'join'}-${group.id}`}
        >
          {isMember ? 'Leave' : 'Join'}
        </Button>
      </div>
    </Card>
  );
}
