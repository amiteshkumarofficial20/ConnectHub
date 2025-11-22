import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GroupCard } from '@/components/GroupCard';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { MessageBubble } from '@/components/MessageBubble';
import { UserAvatar } from '@/components/UserAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { GroupWithMembers, MessageWithSender } from '@shared/schema';

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [messageText, setMessageText] = useState('');

  const { data: groups, isLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ['/api/groups'],
  });

  const { data: myGroups } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/groups/my-memberships'],
  });

  const { data: groupMessages } = useQuery<MessageWithSender[]>({
    queryKey: ['/api/groups', selectedGroup?.id, 'messages'],
    enabled: !!selectedGroup,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; groupPicture?: string }) => {
      return apiRequest('POST', '/api/groups', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: 'Group created',
        description: 'Your group has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not create group',
        variant: 'destructive',
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('POST', `/api/groups/${groupId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/my-memberships'] });
      toast({
        title: 'Joined group',
        description: 'You have joined the group successfully.',
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('POST', `/api/groups/${groupId}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/my-memberships'] });
      setSelectedGroup(null);
      toast({
        title: 'Left group',
        description: 'You have left the group.',
      });
    },
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async (data: { groupId: string; content: string }) => {
      return apiRequest('POST', '/api/messages', { ...data, receiverId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup?.id, 'messages'] });
      setMessageText('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not send message',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedGroup) return;
    sendGroupMessageMutation.mutate({ groupId: selectedGroup.id, content: messageText });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <CreateGroupDialog
            onCreateGroup={(name, description, groupPicture) =>
              createGroupMutation.mutateAsync({ name, description, groupPicture })
            }
          />

          {groups && groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={myGroups?.[group.id] || false}
                onJoin={() => joinGroupMutation.mutate(group.id)}
                onLeave={() => leaveGroupMutation.mutate(group.id)}
                onOpen={() => setSelectedGroup(group)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No groups yet. Create the first one!</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <UserAvatar user={{ name: selectedGroup?.name || '', profilePicture: selectedGroup?.groupPicture || null }} size="md" />
                <div>
                  <p className="font-semibold">{selectedGroup?.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {selectedGroup?.membersCount} members
                  </p>
                </div>
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedGroup(null)}
                data-testid="button-close-group-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {groupMessages && groupMessages.length > 0 ? (
              groupMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.senderId === user?.id}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {myGroups?.[selectedGroup?.id || ''] && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-12"
                  data-testid="input-group-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendGroupMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-group-message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
