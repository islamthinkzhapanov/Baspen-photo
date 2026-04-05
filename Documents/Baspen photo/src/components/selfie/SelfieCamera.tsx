"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useCallback, useEffect } from "react";
import { RiCameraLine, RiCloseLine, RiRefreshLine, RiLoader4Line } from "@remixicon/react";

interface Props {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  isSearching?: boolean;
}

export function SelfieCamera({ onCapture, onClose, isSearching }: Props) {
  const t = useTranslations("public");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setCameraError(null);
      }
    } catch {
      setCameraError(t("camera_error"));
    }
  }, [facingMode, t]);

  useEffect(() => {
    // Use microtask to avoid synchronous setState within effect
    void startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for user-facing camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.9
    );
  }, [facingMode, onCapture]);

  const toggleCamera = () => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
        >
          <RiCloseLine size={24} />
        </button>
        <span className="text-white font-medium">{t("take_selfie")}</span>
        <button
          onClick={toggleCamera}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
        >
          <RiRefreshLine size={20} />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Oval face mask overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            <defs>
              <mask id="faceMask">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="42" rx="18" ry="24" fill="black" />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(0,0,0,0.5)"
              mask="url(#faceMask)"
            />
            <ellipse
              cx="50"
              cy="42"
              rx="18"
              ry="24"
              fill="none"
              stroke="white"
              strokeWidth="0.4"
              strokeDasharray="2 1"
            />
          </svg>
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <div className="flex justify-center mb-4">
                <RiCameraLine size={48} className="opacity-50" />
              </div>
              <p className="mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20"
              >
                {t("retry")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Capture button */}
      <div className="relative z-10 flex justify-center py-8">
        <button
          onClick={capture}
          disabled={!cameraReady || isSearching}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center
            bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all
            active:scale-95"
        >
          {isSearching ? (
            <span className="animate-spin inline-flex text-white"><RiLoader4Line size={32} /></span>
          ) : (
            <div className="w-14 h-14 rounded-full bg-white" />
          )}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
