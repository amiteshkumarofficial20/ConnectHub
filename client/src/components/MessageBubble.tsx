import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { MessageWithSender } from '@shared/schema';
import { Check, CheckCheck, MoreVertical, Ban, Flag, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MessageBubbleProps {
  message: MessageWithSender;
  isSent: boolean;
  onBlock?: (user: any) => void;
  onReport?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isSent, onBlock, onReport, onDelete }: MessageBubbleProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const handleBlockClick = () => {
    setContextMenuOpen(false);
    setBlockDialogOpen(true);
  };

  const handleReportClick = () => {
    setContextMenuOpen(false);
    onReport?.(message.id);
  };

  const handleDeleteClick = () => {
    setContextMenuOpen(false);
    onDelete?.(message.id);
  };

  const handleConfirmBlock = () => {
    if (!isSent && message.sender) {
      onBlock?.(message.sender);
    }
    setBlockDialogOpen(false);
  };

  const senderName = message.sender?.name || 'Unknown';
  const senderUsername = message.sender?.username || 'unknown';

  return (
    <>
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to block <span className="font-semibold text-foreground">{senderName}</span> (@{senderUsername})
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">This user will no longer be able to message you.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block User
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 group`}
        data-testid={`message-${message.id}`}
      >
        <div className={`max-w-sm ${isSent ? 'ml-auto' : 'mr-auto'} flex items-end gap-2`}>
          {!isSent && message.sender && (
            <p className="text-xs font-semibold mb-1 ml-4">{message.sender.name}</p>
          )}
          <div className="relative flex items-center gap-1">
            {!isSent && (
              <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-message-menu-${message.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleBlockClick} className="text-destructive">
                    <Ban className="w-4 h-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReportClick}>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteClick}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div
              className={`px-4 py-2 rounded-2xl ${
                isSent
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {message.mediaUrl && (
                <div className="mb-2">
                  {message.mediaType?.startsWith('image/') ? (
                    <img
                      src={message.mediaUrl}
                      alt="Media"
                      className="rounded-lg max-w-full max-h-64 object-cover"
                    />
                  ) : message.mediaType?.startsWith('video/') ? (
                    <video src={message.mediaUrl} controls className="rounded-lg max-w-full max-h-64" />
                  ) : null}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${isSent ? 'opacity-70' : ''}`}>
                <span className="text-xs">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
                </span>
                {isSent && (
                  message.isRead ? (
                    <CheckCheck className="w-3 h-3" data-testid={`status-read-${message.id}`} />
                  ) : (
                    <Check className="w-3 h-3" data-testid={`status-sent-${message.id}`} />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
