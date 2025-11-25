import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface CreatePostDialogProps {
  onCreatePost: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
}

export function CreatePostDialog({ onCreatePost }: CreatePostDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim() && !mediaUrl.trim()) return;

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
      setShowForm(false);
    } catch (error) {
      console.error('Post creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showForm) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="input-post-content"
            />

            <Input
              type="url"
              placeholder="Image URL (optional)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="h-10"
              data-testid="input-media-url"
            />

            {mediaUrl.trim() && (
              <Input
                type="text"
                placeholder="Media type (e.g., image/jpeg)"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="h-10"
                data-testid="input-media-type"
              />
            )}

            <div className="flex gap-2">
              <Button
                onClick={handlePost}
                disabled={(!content.trim() && !mediaUrl.trim()) || isLoading}
                className="flex-1"
                data-testid="button-submit-post"
              >
                {isLoading ? 'Posting...' : 'Post'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setContent('');
                  setMediaUrl('');
                  setMediaType('');
                }}
                className="w-20"
                data-testid="button-cancel-post"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Button
      onClick={() => setShowForm(true)}
      className="w-full h-12 gap-2 mb-6"
      data-testid="button-create-post"
    >
      <Plus className="w-5 h-5" />
      Create Post
    </Button>
  );
}
