import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl) return;
    setIsSubmitting(true);
    try {
      await onCreatePost(content, mediaUrl || undefined, mediaType || undefined);
      setContent('');
      setMediaUrl('');
      setMediaType('');
      setOpen(false);
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
        </DialogHeader>
        <div className="space-y-4 mt-4">
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
            {mediaUrl && (
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
            disabled={(!content.trim() && !mediaUrl) || isSubmitting}
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
