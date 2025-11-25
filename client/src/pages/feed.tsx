import { useQuery, useMutation } from '@tanstack/react-query';
import { PostCard } from '@/components/PostCard';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { StatusBar } from '@/components/StatusBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { PostWithAuthor, CommentWithAuthor } from '@shared/schema';

export default function Feed() {
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts'],
  });

  const { data: postLikes } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/posts/likes'],
  });

  const { data: postCommentsData } = useQuery<Record<string, CommentWithAuthor[]>>({
    queryKey: ['/api/posts/comments'],
  });

  const createPostMutation = useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType }: { content: string; mediaUrl?: string; mediaType?: string }) => {
      const response = await apiRequest('POST', '/api/posts', { content, mediaUrl, mediaType });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: 'Post created',
        description: 'Your post has been shared successfully.',
      });
    },
    onError: (error) => {
      console.error('Post creation error:', error);
      toast({
        title: 'Error',
        description: 'Could not create post',
        variant: 'destructive',
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('POST', `/api/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/likes'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      return apiRequest('POST', '/api/comments', { postId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not add comment',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Status Section */}
        <div className="mb-8">
          <StatusBar />
        </div>

        {/* Create Post Section */}
        <div className="mb-8">
          <CreatePostDialog onCreatePost={async (content, mediaUrl, mediaType) => {
            try {
              await createPostMutation.mutateAsync({ content, mediaUrl, mediaType });
            } catch (error) {
              console.error('Error creating post:', error);
              throw error;
            }
          }} />
        </div>

        {/* Feed Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Feed</h2>
          {posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={postCommentsData?.[post.id] || []}
                  onLike={() => likeMutation.mutate(post.id)}
                  onComment={(content) => commentMutation.mutate({ postId: post.id, content })}
                  isLiked={postLikes?.[post.id] || false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Create the first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
