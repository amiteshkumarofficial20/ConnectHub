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
import { PlusCircle, Image as ImageIcon } from 'lucide-react';

interface CreatePostDialogProps {
  onCreatePost: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
}

export function CreatePostDialog({ onCreatePost }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = (content.trim().length > 0 || mediaUrl.trim().length > 0) && !isSubmitting;

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canSubmit) return;
    
    setIsSubmitting(true);
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
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-12" data-testid="button-create-post">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
          <DialogDescription>Share your thoughts with the community</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[120px] mt-2"
              data-testid="input-post-content"
            />
          </div>

          <div>
            <Label htmlFor="mediaUrl" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Add Media (optional)
            </Label>
            <Input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-2 h-12"
              data-testid="input-media-url"
            />
            {mediaUrl.trim() && (
              <Input
                type="text"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                placeholder="Media type (e.g., image/jpeg, video/mp4)"
                className="mt-2 h-12"
                data-testid="input-media-type"
              />
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12"
            data-testid="button-submit-post"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
