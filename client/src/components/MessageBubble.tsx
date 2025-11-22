import { formatDistanceToNow } from 'date-fns';
import type { MessageWithSender } from '@shared/schema';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageWithSender;
  isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}
      data-testid={`message-${message.id}`}
    >
      <div className={`max-w-sm ${isSent ? 'ml-auto' : 'mr-auto'}`}>
        {!isSent && message.sender && (
          <p className="text-xs font-semibold mb-1 ml-4">{message.sender.name}</p>
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
  );
}
