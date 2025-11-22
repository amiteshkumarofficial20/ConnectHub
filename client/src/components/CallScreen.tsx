import { useEffect, useRef, useState } from 'react';
import { useCalling } from '@/lib/calling';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import type { User } from '@shared/schema';

interface CallScreenProps {
  remoteUser: User;
}

export function CallScreen({ remoteUser }: CallScreenProps) {
  const { callState, localStream, remoteStream, endCall, toggleAudio, toggleVideo } = useCalling();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(callState.callType === 'video');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleAudio = () => {
    toggleAudio(!audioEnabled);
    setAudioEnabled(!audioEnabled);
  };

  const handleToggleVideo = () => {
    if (callState.callType === 'video') {
      toggleVideo(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-border">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">{remoteUser.name}</h2>
            <p className="text-sm text-muted-foreground">
              {callState.status === 'ringing' ? 'Calling...' : `${formatDuration(callState.duration)}`}
            </p>
          </div>

          {/* Video/Audio Display */}
          {callState.callType === 'video' ? (
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Remote Video */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full bg-black rounded-lg"
                />
              ) : (
                <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                  <UserAvatar user={remoteUser} size="xl" />
                </div>
              )}

              {/* Local Video (PiP) */}
              {localStream && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-32 h-32 bg-black rounded-lg absolute bottom-32 right-4"
                />
              )}
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <UserAvatar user={remoteUser} size="xl" />
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              size="icon"
              variant={audioEnabled ? 'default' : 'destructive'}
              onClick={handleToggleAudio}
              className="rounded-full w-14 h-14"
              data-testid="button-toggle-audio"
            >
              {audioEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            {callState.callType === 'video' && (
              <Button
                size="icon"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={handleToggleVideo}
                className="rounded-full w-14 h-14"
                data-testid="button-toggle-video"
              >
                {videoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>
            )}

            <Button
              size="icon"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14"
              data-testid="button-end-call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
