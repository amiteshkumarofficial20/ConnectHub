import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Image as ImageIcon, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function SidebarActions() {
  const { toast } = useToast();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  
  const [statusContent, setStatusContent] = useState('');
  const [statusMedia, setStatusMedia] = useState('');
  const [statusMediaType, setStatusMediaType] = useState('');
  
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState('');
  const [postMediaType, setPostMediaType] = useState('');

  const createStatusMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/statuses', {
        content: statusContent,
        mediaUrl: statusMedia || undefined,
        mediaType: statusMediaType || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      setStatusContent('');
      setStatusMedia('');
      setStatusMediaType('');
      setStatusDialogOpen(false);
      toast({
        title: 'Status added',
        description: 'Your status will expire in 24 hours.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not add status',
        variant: 'destructive',
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/posts', {
        content: postContent,
        mediaUrl: postMedia || undefined,
        mediaType: postMediaType || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setPostContent('');
      setPostMedia('');
      setPostMediaType('');
      setPostDialogOpen(false);
      toast({
        title: 'Post created',
        description: 'Your post has been shared successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not create post',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      {/* Add Status Button */}
      <Button
        onClick={() => setStatusDialogOpen(true)}
        variant="ghost"
        className="w-full justify-start gap-3 h-10"
        data-testid="button-add-status-sidebar"
      >
        <Plus className="w-5 h-5" />
        <span>Add Status</span>
      </Button>

      {/* Create Post Button */}
      <Button
        onClick={() => setPostDialogOpen(true)}
        variant="ghost"
        className="w-full justify-start gap-3 h-10"
        data-testid="button-create-post-sidebar"
      >
        <Plus className="w-5 h-5" />
        <span>Create Post</span>
      </Button>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
            <DialogDescription>Share something (expires in 24 hours)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={statusContent}
              onChange={(e) => setStatusContent(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="input-status-content-sidebar"
            />
            <Input
              type="url"
              placeholder="Image URL (optional)"
              value={statusMedia}
              onChange={(e) => setStatusMedia(e.target.value)}
              className="h-10"
              data-testid="input-status-media-sidebar"
            />
            {statusMedia.trim() && (
              <Input
                type="text"
                placeholder="Media type (e.g., image/jpeg)"
                value={statusMediaType}
                onChange={(e) => setStatusMediaType(e.target.value)}
                className="h-10"
                data-testid="input-status-type-sidebar"
              />
            )}
            <Button
              onClick={() => createStatusMutation.mutate()}
              disabled={!statusContent.trim() || createStatusMutation.isPending}
              className="w-full"
              data-testid="button-post-status-sidebar"
            >
              {createStatusMutation.isPending ? 'Adding...' : 'Add Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>Share your thoughts with the community</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="input-post-content-sidebar"
            />
            <Input
              type="url"
              placeholder="Image URL (optional)"
              value={postMedia}
              onChange={(e) => setPostMedia(e.target.value)}
              className="h-10"
              data-testid="input-post-media-sidebar"
            />
            {postMedia.trim() && (
              <Input
                type="text"
                placeholder="Media type (e.g., image/jpeg)"
                value={postMediaType}
                onChange={(e) => setPostMediaType(e.target.value)}
                className="h-10"
                data-testid="input-post-type-sidebar"
              />
            )}
            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={!postContent.trim() || createPostMutation.isPending}
              className="w-full"
              data-testid="button-post-submit-sidebar"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
