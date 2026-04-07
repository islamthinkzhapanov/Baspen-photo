"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useCallback, useEffect } from "react";
import { RiCameraLine, RiCloseLine, RiLoader4Line, RiImageAddLine } from "@remixicon/react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1920 },
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
    void startCamera();

    let permissionStatus: PermissionStatus | null = null;
    const handlePermissionChange = () => {
      if (permissionStatus?.state === "granted") {
        void startCamera();
      }
    };
    navigator.permissions?.query({ name: "camera" as PermissionName }).then((status) => {
      permissionStatus = status;
      status.addEventListener("change", handlePermissionChange);
    }).catch(() => { /* permissions API not supported */ });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (permissionStatus) {
        permissionStatus.removeEventListener("change", handlePermissionChange);
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCapture(file);
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Full-screen camera video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          facingMode === "user" ? "scale-x-[-1]" : ""
        }`}
      />

      {/* Oval face mask overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 100 177"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <mask id="faceMask">
              <rect width="100" height="177" fill="white" />
              <ellipse cx="50" cy="72" rx="24" ry="33" fill="black" />
            </mask>
          </defs>
          <rect
            width="100"
            height="177"
            fill="rgba(0,0,0,0.45)"
            mask="url(#faceMask)"
          />
          <ellipse
            cx="50"
            cy="72"
            rx="24"
            ry="33"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.4"
            strokeDasharray="2 1.5"
          />
        </svg>
      </div>

      {/* Instruction text */}
      <div className="relative z-10 pt-[env(safe-area-inset-top,20px)] mt-4">
        <p className="text-white text-center text-[15px] font-medium px-6 drop-shadow-lg">
          Поместите лицо внутри разметки
          <br />и сделайте снимок
        </p>
      </div>

      {/* Close button — top right */}
      <button
        onClick={onClose}
        className="absolute top-[env(safe-area-inset-top,20px)] right-4 mt-3 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60"
      >
        <RiCloseLine size={24} />
      </button>

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
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

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom,20px)] mb-8">
        <div className="flex items-center justify-center gap-8 px-6">
          {/* Spacer for centering */}
          <div className="w-12" />

          {/* Capture button */}
          <button
            onClick={capture}
            disabled={!cameraReady || isSearching}
            className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center
              disabled:opacity-50 transition-all active:scale-95"
          >
            {isSearching ? (
              <span className="animate-spin inline-flex text-white"><RiLoader4Line size={28} /></span>
            ) : (
              <div className="w-[58px] h-[58px] rounded-full bg-white" />
            )}
          </button>

          {/* Gallery upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <RiImageAddLine size={22} />
          </button>
        </div>
      </div>

      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
