import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { StatusWithUser } from '@shared/schema';
import { UserAvatar } from '@/components/UserAvatar';

export function StatusBar() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: statuses } = useQuery<StatusWithUser[]>({
    queryKey: ['/api/statuses'],
  });

  const createStatusMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/statuses', {
        content,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      setContent('');
      setMediaUrl('');
      setMediaType('');
      setShowForm(false);
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

  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      return apiRequest('DELETE', `/api/statuses/${statusId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      toast({
        title: 'Status deleted',
        description: 'Your status has been removed.',
      });
    },
  });

  const handleAddStatus = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      await createStatusMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  if (showForm) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold">Add Status</h3>
          <button
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Textarea
            placeholder="What's on your mind? (expires in 24 hours)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="input-status-content"
          />
          <Input
            type="url"
            placeholder="Image URL (optional)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="h-10"
            data-testid="input-status-media"
          />
          {mediaUrl.trim() && (
            <Input
              type="text"
              placeholder="Media type (e.g., image/jpeg)"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="h-10"
              data-testid="input-status-type"
            />
          )}
          <Button
            onClick={handleAddStatus}
            disabled={!content.trim() || isLoading}
            className="w-full"
            data-testid="button-post-status"
          >
            {isLoading ? 'Adding...' : 'Add Status'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        className="w-full h-12"
        data-testid="button-add-status"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Status
      </Button>

      {statuses && statuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Recent Statuses</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {statuses.slice(0, 5).map((status) => (
              <Card key={status.id} className="p-3 flex items-start justify-between hover-elevate">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserAvatar user={status.user} size="sm" />
                    <span className="text-sm font-medium truncate">{status.user.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{status.content}</p>
                </div>
                <button
                  onClick={() => deleteStatusMutation.mutate(status.id)}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-status-${status.id}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
