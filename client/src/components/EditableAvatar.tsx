import { useRef, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import type { User } from '@shared/schema';

interface EditableAvatarProps {
  user: Pick<User, 'name' | 'profilePicture'>;
  onUpdate: (pictureUrl: string | null) => Promise<void>;
}

export function EditableAvatar({ user, onUpdate }: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        await onUpdate(base64String);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePicture = async () => {
    if (confirm('Remove your profile picture?')) {
      setIsLoading(true);
      try {
        await onUpdate(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className="w-24 h-24">
        <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
        <AvatarFallback className={`${getAvatarColor(user.name)} text-white`}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="absolute bottom-0 right-0 flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="default"
          className="rounded-full h-9 w-9"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          data-testid="button-upload-avatar"
        >
          <Camera className="w-4 h-4" />
        </Button>

        {user.profilePicture && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="rounded-full h-9 w-9"
            onClick={handleRemovePicture}
            disabled={isLoading}
            data-testid="button-remove-avatar"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
        data-testid="input-avatar-upload"
      />
    </div>
  );
}
