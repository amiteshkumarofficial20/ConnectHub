import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

interface CreateGroupDialogProps {
  onCreateGroup: (name: string, description: string, groupPicture?: string) => Promise<void>;
}

export function CreateGroupDialog({ onCreateGroup }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupPicture, setGroupPicture] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(name, description, groupPicture || undefined);
      setName('');
      setDescription('');
      setGroupPicture('');
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-12" data-testid="button-create-group">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome group"
              className="mt-2 h-12"
              data-testid="input-group-name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="min-h-[100px] mt-2"
              data-testid="input-group-description"
            />
          </div>

          <div>
            <Label htmlFor="groupPicture">Group Picture URL (optional)</Label>
            <Input
              id="groupPicture"
              type="url"
              value={groupPicture}
              onChange={(e) => setGroupPicture(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-2 h-12"
              data-testid="input-group-picture"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full h-12"
            data-testid="button-submit-group"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
