import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ConversationListItem } from '@/components/ConversationListItem';
import { MessageBubble } from '@/components/MessageBubble';
import { UserAvatar } from '@/components/UserAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Paperclip, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { User, MessageWithSender } from '@shared/schema';

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: conversations } = useQuery<Record<string, MessageWithSender>>({
    queryKey: ['/api/messages/conversations'],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ['/api/messages', selectedUserId],
    enabled: !!selectedUserId,
  });

  const { data: onlineUsers = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/users/online'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId) return;
    sendMessageMutation.mutate({ receiverId: selectedUserId, content: messageText });
  };

  const filteredUsers = users?.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 h-12"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {usersLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            filteredUsers?.map((u) => (
              <ConversationListItem
                key={u.id}
                user={u}
                lastMessage={conversations?.[u.id]}
                isOnline={onlineUsers[u.id] || false}
                isActive={selectedUserId === u.id}
                onClick={() => setSelectedUserId(u.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <UserAvatar user={selectedUser} size="md" showOnlineStatus isOnline={onlineUsers[selectedUser.id]} />
              <div>
                <p className="font-semibold text-base">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {onlineUsers[selectedUser.id] ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {messagesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="h-16 w-3/4 ml-auto" />
                  <Skeleton className="h-16 w-3/4" />
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isSent={message.senderId === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" data-testid="button-attach">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-12"
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
