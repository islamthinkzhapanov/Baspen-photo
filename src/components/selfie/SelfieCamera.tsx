"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useCallback, useEffect } from "react";
import { RiCameraLine, RiCloseLine, RiRefreshLine, RiLoader4Line, RiImageLine } from "@remixicon/react";

interface Props {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  isSearching?: boolean;
  onPickFromGallery?: () => void;
}

export function SelfieCamera({ onCapture, onClose, isSearching, onPickFromGallery }: Props) {
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

  const toggleCamera = () => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <div className="w-full max-w-[420px] flex justify-end mb-2">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
        >
          <RiCloseLine size={24} />
        </button>
      </div>

      {/* Camera card */}
      <div className="w-full max-w-[420px] bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
        {/* Instruction text */}
        <p className="text-white text-center text-sm font-medium px-6 pt-5 pb-3">
          Поместите лицо внутри разметки
          <br />и сделайте снимок
        </p>

        {/* Camera view */}
        <div className="relative mx-4 mb-4 rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
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
              viewBox="0 0 100 133"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full"
            >
              <defs>
                <mask id="faceMask">
                  <rect width="100" height="133" fill="white" />
                  <ellipse cx="50" cy="55" rx="22" ry="30" fill="black" />
                </mask>
              </defs>
              <rect
                width="100"
                height="133"
                fill="rgba(0,0,0,0.4)"
                mask="url(#faceMask)"
              />
              <ellipse
                cx="50"
                cy="55"
                rx="22"
                ry="30"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                strokeDasharray="2.5 1.5"
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

        {/* Capture & gallery buttons */}
        <div className="flex items-center justify-center gap-6 pb-5">
          <button
            onClick={capture}
            disabled={!cameraReady || isSearching}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
              bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all
              active:scale-95"
          >
            {isSearching ? (
              <span className="animate-spin inline-flex text-white"><RiLoader4Line size={24} /></span>
            ) : (
              <div className="w-11 h-11 rounded-full bg-white" />
            )}
          </button>
          {onPickFromGallery && (
            <button
              onClick={onPickFromGallery}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
            >
              <RiImageLine size={22} />
            </button>
          )}
        </div>
      </div>

      {/* "Найти фото" button below card */}
      <button
        onClick={capture}
        disabled={!cameraReady || isSearching}
        className="w-full max-w-[420px] mt-3 py-3.5 bg-white text-black rounded-xl text-[15px] font-medium
          hover:bg-white/90 disabled:opacity-50 transition-all"
      >
        Найти фото
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
