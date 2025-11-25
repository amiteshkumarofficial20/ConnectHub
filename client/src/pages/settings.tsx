import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EditableAvatar } from '@/components/EditableAvatar';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function Settings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
    },
  });

  const handleProfilePictureUpdate = async (pictureUrl: string | null) => {
    try {
      const updatedUser = await apiRequest('PATCH', '/api/users/profile', { 
        profilePicture: pictureUrl 
      });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not update profile picture',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: UpdateProfileData) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await apiRequest('PATCH', '/api/users/profile', data);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
          
          <div className="flex flex-col items-center mb-6">
            <EditableAvatar user={user} onUpdate={handleProfilePictureUpdate} />
            <p className="text-sm text-muted-foreground mt-4">@{user.username}</p>
          </div>

          <Separator className="my-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        className="h-12"
                        data-testid="input-settings-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                        disabled={isSubmitting}
                        data-testid="input-settings-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12"
                data-testid="button-save-settings"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">@{user.username}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Changes</span>
              <span className="font-medium">{(user as any).emailChangeCount || 0} times</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username Changes</span>
              <span className="font-medium">{(user as any).usernameChangeCount || 0} times</span>
            </div>
            {user.createdAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
