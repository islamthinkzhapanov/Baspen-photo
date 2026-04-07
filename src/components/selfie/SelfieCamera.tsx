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
          width: { ideal: 720 },
          height: { ideal: 960 },
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Camera card — Instagram-like aspect ratio */}
      <div className="relative w-full max-w-[450px] rounded-[24px] overflow-hidden bg-black"
        style={{ aspectRatio: "450/700" }}
      >
        {/* Camera video */}
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
            viewBox="0 0 450 700"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            <defs>
              <mask id="faceMask">
                <rect width="450" height="700" fill="white" />
                <ellipse cx="225" cy="310" rx="150" ry="210" fill="black" />
              </mask>
            </defs>
            <rect
              width="450"
              height="700"
              fill="rgba(0,0,0,0.45)"
              mask="url(#faceMask)"
            />
            <ellipse
              cx="225"
              cy="310"
              rx="150"
              ry="210"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              strokeDasharray="10 6"
            />
          </svg>
        </div>

        {/* Instruction text */}
        <div className="absolute top-0 left-0 right-0 z-10 pt-8 px-6">
          <p className="text-white text-center text-[15px] font-medium leading-[20px]">
            Поместите лицо внутри разметки
            <br />и сделайте снимок
          </p>
        </div>

        {/* Close button — top right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-5 z-20 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
        >
          <RiCloseLine size={28} />
        </button>

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-[24px]">
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
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-6">
          <div className="flex items-center justify-center gap-6 px-6">
            {/* Spacer */}
            <div className="w-10" />

            {/* Capture button */}
            <button
              onClick={capture}
              disabled={!cameraReady || isSearching}
              className="w-[70px] h-[70px] rounded-full border-[4px] border-white flex items-center justify-center
                disabled:opacity-50 transition-all active:scale-95"
            >
              {isSearching ? (
                <span className="animate-spin inline-flex text-white"><RiLoader4Line size={24} /></span>
              ) : (
                <div className="w-[56px] h-[56px] rounded-full bg-white" />
              )}
            </button>

            {/* Gallery upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-[10px] bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <RiImageAddLine size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
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
