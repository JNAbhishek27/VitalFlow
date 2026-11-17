import { useEffect, useRef } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import type { CameraStatus } from '../types/vitals';

interface CameraPreviewProps {
  stream: MediaStream | null;
  cameraStatus: CameraStatus;
  showGuideOverlay?: boolean;
  compact?: boolean;
}

export function CameraPreview({
  stream,
  cameraStatus,
  showGuideOverlay = true,
  compact = false,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    if (stream) {
      video.play().catch(() => {
        // Autoplay may resolve asynchronously once metadata loads
      });
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#040711] ${
        compact ? 'aspect-video w-full' : 'aspect-video w-full'
      }`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 px-4 text-center">
          {cameraStatus === 'denied' || cameraStatus === 'unavailable' || cameraStatus === 'error' ? (
            <CameraOff className="h-6 w-6 text-slate-500" aria-hidden="true" />
          ) : (
            <Camera className="h-6 w-6 text-slate-500" aria-hidden="true" />
          )}
          <p className="text-xs text-slate-400">
            {cameraStatus === 'requesting'
              ? 'Waiting for camera stream...'
              : cameraStatus === 'denied'
                ? 'Camera access was declined'
                : cameraStatus === 'unavailable'
                  ? 'No active camera feed'
                  : 'Camera preview inactive'}
          </p>
        </div>
      )}

      {stream && showGuideOverlay && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[68%] w-[42%] rounded-full border border-sky-400/25" />
        </div>
      )}
    </div>
  );
}
