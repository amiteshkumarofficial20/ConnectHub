import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/lib/auth';
import { useLocation, useParams } from 'wouter';
import { Edit, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { PostWithAuthor, User } from '@shared/schema';

export default function Profile() {
  const { user: currentUser } = useAuth();
  const { userId } = useParams() as { userId?: string };
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // If no userId in params, show current user's profile
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = profileUserId === currentUser?.id;

  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users', profileUserId],
    enabled: !!profileUserId && !isOwnProfile,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  const displayUser = isOwnProfile ? currentUser : profileUser;

  const { data: userPosts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts/user', profileUserId],
  });

  const { data: followerStats = { followers: 0, following: 0 } } = useQuery({
    queryKey: ['/api/users/stats', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/stats`);
      if (!response.ok) return { followers: 0, following: 0 };
      return response.json();
    },
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ['/api/friend-requests/sent'],
  });

  const isSent = sentRequests.includes(profileUserId!);

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/friend-requests', { receiverId: profileUserId });
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
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/friend-requests/${profileUserId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Cancelled',
        description: 'Friend request cancelled',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/sent'] });
    },
  });

  if (userLoading || !displayUser) return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {!isOwnProfile && (
          <Button
            variant="ghost"
            onClick={() => setLocation('/friends')}
            className="mb-4"
            data-testid="button-back-to-friends"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <Card className="p-8">
          <div className="flex flex-col items-center">
            <UserAvatar user={displayUser} size="xl" className="mb-4" />
            <h1 className="text-2xl font-bold mb-1">{displayUser.name}</h1>
            <p className="text-sm text-muted-foreground mb-2">@{displayUser.username}</p>
            {displayUser.bio && (
              <p className="text-sm text-center max-w-md mb-4">{displayUser.bio}</p>
            )}
            
            {isOwnProfile ? (
              <Button
                onClick={() => setLocation('/settings')}
                className="mt-4"
                data-testid="button-edit-profile"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <Button
                onClick={() => isSent ? cancelRequestMutation.mutate() : sendRequestMutation.mutate()}
                disabled={sendRequestMutation.isPending || cancelRequestMutation.isPending}
                variant={isSent ? 'outline' : 'default'}
                className="mt-4"
                data-testid="button-send-friend-request"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isSent ? 'Request Sent' : 'Add Friend'}
              </Button>
            )}
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{userPosts?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{followerStats.followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{followerStats.following}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">{isOwnProfile ? 'Your Posts' : 'Posts'}</h2>
          {postsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={[]}
                  onLike={() => {}}
                  onComment={() => {}}
                  isLiked={false}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">{isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
