import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const searchResults = searchQuery.trim() 
    ? allUsers.filter(
        (u) =>
          u.id !== user?.id &&
          (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const { data: pendingRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/friend-requests/pending'],
  });

  const { data: sentRequests = [] } = useQuery<string[]>({
    queryKey: ['/api/friend-requests/sent'],
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      return apiRequest('POST', '/api/friend-requests', { receiverId });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Friend request sent!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/sent'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not send friend request',
        variant: 'destructive',
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      return apiRequest('DELETE', `/api/friend-requests/${receiverId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Cancelled',
        description: 'Friend request cancelled',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/sent'] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest('PATCH', `/api/friend-requests/${requestId}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Friend request accepted!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/pending'] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest('PATCH', `/api/friend-requests/${requestId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/pending'] });
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Find Friends</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="pl-10 h-11"
            data-testid="input-search-friends"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Friend Requests</h2>
            <div className="space-y-3">
              {pendingRequests.map((request: any) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <UserAvatar user={request.sender} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{request.sender.name}</p>
                        <p className="text-sm text-muted-foreground">@{request.sender.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => acceptRequestMutation.mutate(request.id)}
                        disabled={acceptRequestMutation.isPending}
                        data-testid={`button-accept-${request.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectRequestMutation.mutate(request.id)}
                        disabled={rejectRequestMutation.isPending}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {searchQuery && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Search Results</h2>
            {searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((searchUser) => {
                  const isOwnProfile = searchUser.id === user?.id;
                  return (
                    <Card key={searchUser.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setLocation(`/profile${isOwnProfile ? '' : `/${searchUser.id}`}`)} data-testid={`card-user-${searchUser.id}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <UserAvatar user={searchUser} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{searchUser.name}</p>
                            <p className="text-sm text-muted-foreground">@{searchUser.username}</p>
                            {isOwnProfile && <p className="text-xs text-muted-foreground">(You)</p>}
                          </div>
                        </div>
                        {!isOwnProfile && (
                          <Button
                            size="sm"
                            variant={sentRequests.includes(searchUser.id) ? 'outline' : 'default'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (sentRequests.includes(searchUser.id)) {
                                cancelRequestMutation.mutate(searchUser.id);
                              } else {
                                sendRequestMutation.mutate(searchUser.id);
                              }
                            }}
                            disabled={sendRequestMutation.isPending || cancelRequestMutation.isPending}
                            data-testid={`button-add-friend-${searchUser.id}`}
                          >
                            <UserPlus className="w-4 h-4" />
                            {sentRequests.includes(searchUser.id) ? 'Request Sent' : 'Add'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No users found</p>
            )}
          </div>
        )}

        {!searchQuery && pendingRequests.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Search for users to send friend requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
