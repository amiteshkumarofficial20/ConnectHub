import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

interface CallState {
  callId: string | null;
  callType: 'audio' | 'video';
  status: 'idle' | 'ringing' | 'ongoing' | 'ended';
  remoteUserId: string | null;
  remoteName: string | null;
  duration: number;
}

interface CallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (receiverId: string, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallingProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    callType: 'audio',
    status: 'idle',
    remoteUserId: null,
    remoteName: null,
    duration: 0,
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  const initiateCall = useCallback(async (receiverId: string, type: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 640, height: 480 } : false,
      });

      setLocalStream(stream);
      setCallState({
        ...callState,
        callId: Math.random().toString(36),
        callType: type,
        status: 'ringing',
        remoteUserId: receiverId,
      });

      // Initialize peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      });

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peerConnectionRef.current = peerConnection;
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  }, [callState]);

  const acceptCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.callType === 'video',
      });

      setLocalStream(stream);
      setCallState(prev => ({ ...prev, status: 'ongoing' }));

      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      durationIntervalRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  }, [callState.callType]);

  const rejectCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setCallState({
      callId: null,
      callType: 'audio',
      status: 'idle',
      remoteUserId: null,
      remoteName: null,
      duration: 0,
    });
  }, [localStream]);

  const endCall = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallState({
      callId: null,
      callType: 'audio',
      status: 'idle',
      remoteUserId: null,
      remoteName: null,
      duration: 0,
    });
  }, [localStream]);

  const toggleAudio = useCallback((enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, [localStream]);

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCalling() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCalling must be used within a CallingProvider');
  }
  return context;
}
