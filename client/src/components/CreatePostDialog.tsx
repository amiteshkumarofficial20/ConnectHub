import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CreatePostDialogProps {
  onCreatePost: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
}

export function CreatePostDialog({ onCreatePost }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaUrl.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onCreatePost(
        content.trim(),
        mediaUrl.trim() || undefined,
        mediaType.trim() || undefined
      );
      setContent('');
      setMediaUrl('');
      setMediaType('');
      setOpen(false);
    } catch (error) {
      console.error('Post creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full h-12 gap-2" 
          data-testid="button-create-post"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
          <DialogDescription>Share something with the community</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="post-content">What's on your mind?</Label>
            <Textarea
              id="post-content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-post-content"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-url">Image URL (optional)</Label>
            <Input
              id="media-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              data-testid="input-media-url"
            />
          </div>

          {mediaUrl.trim() && (
            <div className="space-y-2">
              <Label htmlFor="media-type">Media Type</Label>
              <Input
                id="media-type"
                type="text"
                placeholder="image/jpeg"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                data-testid="input-media-type"
              />
            </div>
          )}

          <Button
            onClick={handleCreatePost}
            disabled={(!content.trim() && !mediaUrl.trim()) || isLoading}
            className="w-full"
            data-testid="button-submit-post"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
