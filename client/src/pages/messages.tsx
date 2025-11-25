import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ConversationListItem } from '@/components/ConversationListItem';
import { MessageBubble } from '@/components/MessageBubble';
import { UserAvatar } from '@/components/UserAvatar';
import { CallScreen } from '@/components/CallScreen';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Send, Paperclip, Search, Phone, Video, User as UserIcon, MoreVertical, Ban } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useCalling } from '@/lib/calling';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { User, MessageWithSender } from '@shared/schema';

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { initiateCall, callState } = useCalling();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockedUserDetails, setBlockedUserDetails] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAudioCall = async () => {
    if (selectedUserId) {
      try {
        await initiateCall(selectedUserId, 'audio');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not start audio call',
          variant: 'destructive',
        });
      }
    }
  };

  const handleVideoCall = async () => {
    if (selectedUserId) {
      try {
        await initiateCall(selectedUserId, 'video');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not start video call',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBlockUser = () => {
    if (selectedUser) {
      setBlockedUserDetails({ id: selectedUser.id, name: selectedUser.name });
      setBlockDialogOpen(true);
    }
  };

  const confirmBlockUser = () => {
    setBlockDialogOpen(false);
    toast({
      title: 'User Blocked',
      description: `${blockedUserDetails?.name} (ID: ${blockedUserDetails?.id}) has been blocked`,
      variant: 'default',
    });
    setBlockedUserDetails(null);
  };

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
      (!searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  return (
    <>
      {callState.status !== 'idle' && selectedUser && <CallScreen remoteUser={selectedUser} />}
      
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to block <span className="font-semibold text-foreground">{blockedUserDetails?.name}</span>
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">User ID: {blockedUserDetails?.id}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 p-3 bg-destructive/10 rounded-md">
            <p className="text-sm text-foreground">
              This user will no longer be able to message you or see your profile.
            </p>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlockUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block User
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={selectedUser} size="md" showOnlineStatus isOnline={onlineUsers[selectedUser.id]} />
                <div>
                  <p className="font-semibold text-base">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {onlineUsers[selectedUser.id] ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleAudioCall}
                  data-testid="button-audio-call"
                >
                  <Phone className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </Button>
                <div className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4 text-muted-foreground" data-testid="icon-user-video" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleVideoCall}
                    data-testid="button-video-call"
                  >
                    <Video className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      data-testid="button-more-options"
                    >
                      <MoreVertical className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      onBlock={(sender) => {
                        setBlockedUserDetails({ id: sender.id, name: sender.name });
                        setBlockDialogOpen(true);
                      }}
                      onReport={(messageId) => {
                        toast({
                          title: 'Message Reported',
                          description: 'Thank you for reporting this message',
                        });
                      }}
                      onDelete={(messageId) => {
                        toast({
                          title: 'Message Deleted',
                          description: 'Message has been removed',
                        });
                      }}
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
    </>
  );
}
