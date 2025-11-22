import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { Heart, MessageSquare, Send } from 'lucide-react';
import type { PostWithAuthor, CommentWithAuthor } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: PostWithAuthor;
  comments?: CommentWithAuthor[];
  onLike: () => void;
  onComment: (content: string) => void;
  isLiked: boolean;
}

export function PostCard({ post, comments = [], onLike, onComment, isLiked }: PostCardProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onComment(commentText);
    setCommentText('');
    setShowComments(true);
    setIsSubmitting(false);
  };

  return (
    <Card className="p-6" data-testid={`card-post-${post.id}`}>
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar user={post.author} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-base">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">
            @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {post.content && (
        <p className="text-sm mb-4 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
          {post.content}
        </p>
      )}

      {post.mediaUrl && (
        <div className="mb-4 rounded-lg overflow-hidden">
          {post.mediaType?.startsWith('image/') ? (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full max-h-96 object-cover"
              data-testid={`img-post-media-${post.id}`}
            />
          ) : post.mediaType?.startsWith('video/') ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-96"
              data-testid={`video-post-media-${post.id}`}
            />
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          className={`gap-2 ${isLiked ? 'text-destructive' : ''}`}
          data-testid={`button-like-${post.id}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.likesCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2"
          data-testid={`button-comments-${post.id}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">{post.commentsCount}</span>
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {comments.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2" data-testid={`comment-${comment.id}`}>
                  <UserAvatar user={comment.author} size="sm" />
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs font-semibold mb-1">{comment.author.name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-3">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <UserAvatar user={user!} size="sm" />
            <div className="flex-1 flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] resize-none"
                data-testid={`input-comment-${post.id}`}
              />
              <Button
                size="icon"
                onClick={handleComment}
                disabled={!commentText.trim() || isSubmitting}
                data-testid={`button-send-comment-${post.id}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
