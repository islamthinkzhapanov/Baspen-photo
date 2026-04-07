"use client";

import { useTranslations } from "next-intl";
import { useUploadPhotos } from "@/hooks/usePhotos";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  RiUploadLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "@remixicon/react";

interface Props {
  eventId: string;
}

export function PhotoUploadZone({ eventId }: Props) {
  const t = useTranslations("upload");
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);

  const uploadMutation = useUploadPhotos(eventId, (done, total) => {
    setUploadProgress({ done, total });
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploadProgress({ total: acceptedFiles.length, done: 0 });

      uploadMutation.mutate(acceptedFiles, {
        onSuccess: (results) => {
          const done = results.filter(
            (r: PromiseSettledResult<unknown>) => r.status === "fulfilled"
          ).length;
          setUploadProgress({ total: acceptedFiles.length, done });
          setTimeout(() => setUploadProgress(null), 4000);
        },
        onError: () => {
          setUploadProgress(null);
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
    disabled: uploadMutation.isPending,
  });

  const isUploading = uploadMutation.isPending && uploadProgress;
  const isDone = !uploadMutation.isPending && uploadProgress;
  const percent = uploadProgress
    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
    : 0;

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-border-active"
        } ${uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
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
      {isUploading && (
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
              {percent}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload result */}
      {isDone && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          {uploadProgress.done === uploadProgress.total ? (
            <RiCheckboxCircleLine size={16} className="text-green-600" />
          ) : (
            <RiCloseCircleLine size={16} className="text-red-600" />
          )}
          {t("progress", {
            current: uploadProgress.done,
            total: uploadProgress.total,
          })}
        </div>
      )}
    </div>
  );
}
