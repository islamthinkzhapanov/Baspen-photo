"use client";

import { useTranslations } from "next-intl";
import { useUploadPhotos } from "@/hooks/usePhotos";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { RiUploadLine, RiCheckboxCircleLine, RiCloseCircleLine } from "@remixicon/react";

interface Props {
  eventId: string;
}

export function PhotoUploadZone({ eventId }: Props) {
  const t = useTranslations("upload");
  const uploadMutation = useUploadPhotos(eventId);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);

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
          setTimeout(() => setUploadProgress(null), 3000);
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

      {uploadMutation.isPending && (
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {t("uploading")}
        </div>
      )}

      {uploadProgress && !uploadMutation.isPending && (
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
