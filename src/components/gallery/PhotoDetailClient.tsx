"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  RiDownloadLine,
  RiShareLine,
  RiArrowLeftLine,
  RiHeartLine,
  RiLoader4Line,
  RiCloseLine,
} from "@remixicon/react";
import { RiInformationLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

interface PhotoDetail {
  photo: {
    id: string;
    thumbnailPath: string | null;
    watermarkedPath: string | null;
    width: number | null;
    height: number | null;
    exifData: Record<string, unknown> | null;
    createdAt: string;
    facesCount: number;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    branding: { logo?: string; primaryColor?: string } | null;
  } | null;
  freeDownload: boolean;
}

export function PhotoDetailClient({ photoId }: { photoId: string }) {
  const t = useTranslations("gallery");
  const tp = useTranslations("public");
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery<PhotoDetail>({
    queryKey: ["photo", photoId],
    queryFn: async () => {
      const res = await fetch(`/api/photos/${photoId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/download`);
      const { url, filename } = await res.json();

      // Trigger download via temporary link
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Ignore download errors
    } finally {
      setDownloading(false);
    }
  }, [photoId]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: data?.event?.title || "Photo",
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [data?.event?.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="animate-spin inline-flex text-white"><RiLoader4Line size={32} /></span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Photo not found
      </div>
    );
  }

  const { photo, event, freeDownload } = data;
  const imageUrl = photo.watermarkedPath || photo.thumbnailPath || "";

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <button
          onClick={() => {
            if (event) {
              router.push(`/e/${event.slug}`);
            } else {
              router.back();
            }
          }}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <RiArrowLeftLine size={20} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <RiInformationLine size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <RiHeartLine size={20} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <RiShareLine size={20} />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            {downloading ? (
              <span className="animate-spin inline-flex"><RiLoader4Line size={20} /></span>
            ) : (
              <RiDownloadLine size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt=""
          className="max-h-[80vh] max-w-full object-contain rounded-lg"
        />
      </div>

      {/* Event info bar */}
      {event && (
        <div className="p-4 text-white/70 text-center text-sm">
          {event.title}
          {!freeDownload && (
            <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              {t("download")} — {tp("powered_by")}
            </span>
          )}
        </div>
      )}

      {/* Info panel (slide-up) */}
      {showInfo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 text-white rounded-t-2xl p-6 max-h-[50vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Photo info</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 hover:bg-white/10 rounded-full"
            >
              <RiCloseLine size={20} />
            </button>
          </div>
          <div className="space-y-2 text-sm text-white/70">
            {photo.width && photo.height && (
              <div className="flex justify-between">
                <span>Resolution</span>
                <span>
                  {photo.width} x {photo.height}
                </span>
              </div>
            )}
            {photo.facesCount > 0 && (
              <div className="flex justify-between">
                <span>Faces detected</span>
                <span>{photo.facesCount}</span>
              </div>
            )}
            {photo.createdAt && (
              <div className="flex justify-between">
                <span>Uploaded</span>
                <span>{new Date(photo.createdAt).toLocaleString("ru-RU")}</span>
              </div>
            )}
            {photo.exifData && (
              <>
                {photo.exifData.format && (
                  <div className="flex justify-between">
                    <span>Format</span>
                    <span>{String(photo.exifData.format).toUpperCase()}</span>
                  </div>
                )}
                {photo.exifData.density && (
                  <div className="flex justify-between">
                    <span>DPI</span>
                    <span>{String(photo.exifData.density)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
