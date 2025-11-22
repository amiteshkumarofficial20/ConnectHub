import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Edit } from 'lucide-react';
import type { PostWithAuthor } from '@shared/schema';

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: userPosts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts/user', user?.id],
  });

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="p-8">
          <div className="flex flex-col items-center">
            <UserAvatar user={user} size="xl" className="mb-4" />
            <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
            <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-center max-w-md mb-4">{user.bio}</p>
            )}
            <Button
              onClick={() => setLocation('/settings')}
              className="mt-4"
              data-testid="button-edit-profile"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{userPosts?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Your Posts</h2>
          {isLoading ? (
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
              <p className="text-muted-foreground">You haven't posted anything yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
