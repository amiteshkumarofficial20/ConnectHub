import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
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
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Home, MessageCircle, Users, User, Settings, LogOut, Bell, UserPlus, Sparkles, PlusCircle } from 'lucide-react';

const menuItems = [
  { title: 'Feed', icon: Home, path: '/' },
  { title: 'Messages', icon: MessageCircle, path: '/messages' },
  { title: 'Friends', icon: UserPlus, path: '/friends' },
  { title: 'Groups', icon: Users, path: '/groups' },
  { title: 'Notifications', icon: Bell, path: '/notifications' },
  { title: 'Profile', icon: User, path: '/profile' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

const feedIndex = menuItems.findIndex(item => item.title === 'Feed');
const messagesIndex = menuItems.findIndex(item => item.title === 'Messages');

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [statusOpen, setStatusOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

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
      setStatusOpen(false);
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
      setPostOpen(false);
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

  if (!user) return null;

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-base">ConnectHub</h2>
              <p className="text-xs text-muted-foreground">Stay connected</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, index) => {
                  const isActive = location === item.path;
                  
                  // Render menu item
                  const menuItem = (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => setLocation(item.path)}
                        isActive={isActive}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );

                  // Insert action buttons after Feed and before Messages
                  if (index === feedIndex) {
                    return (
                      <div key={`feed-${item.title}`}>
                        {menuItem}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => setStatusOpen(true)}
                            data-testid="button-add-status"
                          >
                            <Sparkles className="w-5 h-5" />
                            <span>Add Status</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => setPostOpen(true)}
                            data-testid="button-create-post"
                          >
                            <PlusCircle className="w-5 h-5" />
                            <span>Create Post</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </div>
                    );
                  }

                  return menuItem;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
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
              className="min-h-[100px] resize-none"
              data-testid="input-status-content"
            />
            <Input
              type="url"
              placeholder="Image URL (optional)"
              value={statusMedia}
              onChange={(e) => setStatusMedia(e.target.value)}
              className="h-10"
              data-testid="input-status-media"
            />
            {statusMedia.trim() && (
              <Input
                type="text"
                placeholder="Media type (e.g., image/jpeg)"
                value={statusMediaType}
                onChange={(e) => setStatusMediaType(e.target.value)}
                className="h-10"
                data-testid="input-status-type"
              />
            )}
            <Button
              onClick={() => createStatusMutation.mutate()}
              disabled={!statusContent.trim() || createStatusMutation.isPending}
              className="w-full"
              data-testid="button-submit-status"
            >
              {createStatusMutation.isPending ? 'Adding...' : 'Add Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
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
              className="min-h-[100px] resize-none"
              data-testid="input-post-content"
            />
            <Input
              type="url"
              placeholder="Image URL (optional)"
              value={postMedia}
              onChange={(e) => setPostMedia(e.target.value)}
              className="h-10"
              data-testid="input-post-media"
            />
            {postMedia.trim() && (
              <Input
                type="text"
                placeholder="Media type (e.g., image/jpeg)"
                value={postMediaType}
                onChange={(e) => setPostMediaType(e.target.value)}
                className="h-10"
                data-testid="input-post-type"
              />
            )}
            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={!postContent.trim() || createPostMutation.isPending}
              className="w-full"
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Create Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
