"use client";

import { useTranslations } from "next-intl";
import { useUploadPhotos, useProcessingStatus } from "@/hooks/usePhotos";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  RiUploadLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "@remixicon/react";
import { AlbumSelector } from "@/components/album/AlbumSelector";
import { useCreateAlbum, type Album } from "@/hooks/useAlbums";

interface Props {
  eventId: string;
  albumId?: string | null;
  albums?: Album[];
  onAlbumChange?: (albumId: string | null) => void;
}

type Phase = "idle" | "uploading" | "processing" | "done";

export function PhotoUploadZone({ eventId, albumId, albums, onAlbumChange }: Props) {
  const t = useTranslations("upload");
  const qc = useQueryClient();
  const createAlbumMutation = useCreateAlbum(eventId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);

  const { data: processingStatus } = useProcessingStatus(
    eventId,
    phase === "processing"
  );

  const uploadMutation = useUploadPhotos(eventId, (done, total) => {
    setUploadProgress({ done, total });
  }, albumId);

  // Transition from processing → done when worker finishes
  useEffect(() => {
    if (phase !== "processing" || !processingStatus) return;
    if (processingStatus.processing === 0) {
      setPhase("done");
      // Refresh photo list & album counts now that processing is complete
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
      setTimeout(() => setPhase("idle"), 4000);
    }
  }, [phase, processingStatus, qc, eventId]);

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

  // Upload progress: 0-100%
  const uploadPercent = uploadProgress.total
    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
    : 0;

  // Processing progress: 0-100%
  let processingPercent = 0;
  if (phase === "processing" && processingStatus) {
    const ready = processingStatus.ready + processingStatus.failed;
    const total = processingStatus.total;
    processingPercent = total ? Math.round((ready / total) * 100) : 0;
  }

  return (
    <div>
      {/* Album selector for upload target */}
      {albums && albums.length > 0 && onAlbumChange && (
        <AlbumSelector
          albums={albums}
          value={albumId ?? null}
          onChange={onAlbumChange}
          onCreateAlbum={(name) =>
            createAlbumMutation.mutate({ name }, {
              onSuccess: (newAlbum: Album) => onAlbumChange(newAlbum.id),
            })
          }
          className="mb-3"
        />
      )}

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

      {/* Upload progress bar */}
      {phase === "uploading" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>
                {t("progress", {
                  current: uploadProgress.done,
                  total: uploadProgress.total,
                })}
              </span>
            </div>
            <span className="text-xs text-text-secondary tabular-nums font-medium">
              {uploadPercent}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing progress */}
      {phase === "processing" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>
                {processingStatus
                  ? t("processing_progress", {
                      current: processingStatus.ready + processingStatus.failed,
                      total: processingStatus.total,
                    })
                  : t("processing_progress", { current: 0, total: uploadedCount })}
              </span>
            </div>
            <span className="text-xs text-text-secondary tabular-nums font-medium">
              {processingPercent}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${processingPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload result */}
      {phase === "done" && (
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
