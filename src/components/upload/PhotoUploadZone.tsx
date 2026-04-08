"use client";

import { useTranslations } from "next-intl";
import { useUploadPhotos, useProcessingStatus } from "@/hooks/usePhotos";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  RiUploadLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "@remixicon/react";

interface Props {
  eventId: string;
}

type Phase = "idle" | "uploading" | "processing" | "done";

export function PhotoUploadZone({ eventId }: Props) {
  const t = useTranslations("upload");
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);

  const { data: processingStatus } = useProcessingStatus(
    eventId,
    phase === "processing"
  );

  const uploadMutation = useUploadPhotos(eventId, (done, total) => {
    setUploadProgress({ done, total });
  });

  // Transition from processing → done when worker finishes
  useEffect(() => {
    if (phase !== "processing" || !processingStatus) return;
    if (processingStatus.processing === 0) {
      setPhase("done");
      setTimeout(() => setPhase("idle"), 4000);
    }
  }, [phase, processingStatus]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setPhase("uploading");
      setUploadProgress({ total: acceptedFiles.length, done: 0 });

      uploadMutation.mutate(acceptedFiles, {
        onSuccess: (results) => {
          const done = results.filter(
            (r: PromiseSettledResult<unknown>) => r.status === "fulfilled"
          ).length;
          setUploadedCount(done);
          setUploadProgress({ total: acceptedFiles.length, done });
          // Move to processing phase — wait for worker
          setPhase("processing");
        },
        onError: () => {
          setPhase("done");
          setTimeout(() => setPhase("idle"), 4000);
        },
      });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 50 * 1024 * 1024,
    disabled: phase === "uploading" || phase === "processing",
  });

  // Compute unified percent
  let percent = 0;
  let statusText = "";

  if (phase === "uploading") {
    percent = uploadProgress.total
      ? Math.round((uploadProgress.done / uploadProgress.total) * 50)
      : 0;
    statusText = t("progress", {
      current: uploadProgress.done,
      total: uploadProgress.total,
    });
  } else if (phase === "processing" && processingStatus) {
    const ready = processingStatus.ready + processingStatus.failed;
    const total = processingStatus.total;
    percent = total ? 50 + Math.round((ready / total) * 50) : 50;
    statusText = t("processing_progress", {
      current: ready,
      total,
    });
  } else if (phase === "done") {
    percent = 100;
  }

  const showProgress = phase === "uploading" || phase === "processing";
  const showDone = phase === "done";

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-border-active"
        } ${phase === "uploading" || phase === "processing" ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-3">
          <RiUploadLine size={32} className="text-text-secondary" />
        </div>
        <p className="font-medium">{t("drag_drop")}</p>
        <p className="text-sm text-text-secondary">{t("or_click")}</p>
        <p className="text-xs text-text-secondary mt-1">{t("formats")}</p>
      </div>

      {/* Unified progress bar */}
      {showProgress && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>{statusText}</span>
            </div>
            <span className="text-xs text-text-secondary tabular-nums font-medium">
              {percent}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload result */}
      {showDone && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          {uploadedCount === uploadProgress.total ? (
            <RiCheckboxCircleLine size={16} className="text-green-600" />
          ) : (
            <RiCloseCircleLine size={16} className="text-red-600" />
          )}
          {t("progress", {
            current: uploadedCount,
            total: uploadProgress.total,
          })}
        </div>
      )}
    </div>
  );
}
