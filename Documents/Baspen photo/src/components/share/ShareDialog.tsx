"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiLinkM,
  RiCheckLine,
  RiLoader4Line,
  RiDownloadLine,
  RiMessage3Line,
  RiSendPlaneLine,
} from "@remixicon/react";
import { Button } from "@tremor/react";

interface Props {
  photoId: string;
  photoUrl: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Share dialog with branded frame download and social share buttons.
 *
 * Supports:
 * - Copy link
 * - Share to Instagram Stories (via download)
 * - Share to Telegram
 * - Share to WhatsApp
 * - Download branded share image
 * - Native share (mobile)
 */
export function ShareDialog({
  photoId,
  photoUrl,
  eventTitle,
  open,
  onClose,
}: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/photo/${photoId}`
    : "";

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pageUrl]);

  const handleGenerateShare = useCallback(async () => {
    if (shareUrl) return shareUrl;
    setGenerating(true);
    try {
      const res = await fetch(`/api/share/${photoId}`);
      const data = await res.json();
      setShareUrl(data.url);
      return data.url as string;
    } catch {
      return null;
    } finally {
      setGenerating(false);
    }
  }, [photoId, shareUrl]);

  const handleDownloadBranded = useCallback(async () => {
    const url = await handleGenerateShare();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle}-photo.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [handleGenerateShare, eventTitle]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: eventTitle,
        text: t("share_text", { event: eventTitle }),
        url: pageUrl,
      });
    }
  }, [eventTitle, pageUrl, t]);

  const handleTelegram = useCallback(() => {
    const text = encodeURIComponent(`${eventTitle}\n${pageUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${text}`, "_blank");
  }, [eventTitle, pageUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${eventTitle}\n${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [eventTitle, pageUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-bg rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-secondary rounded-full"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Share image preview */}
        <img
          src={photoUrl}
          alt=""
          className="w-full rounded-lg max-h-48 object-cover"
        />

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Telegram */}
          <button
            onClick={handleTelegram}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-bg-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#26A5E4]/10 flex items-center justify-center">
              <RiSendPlaneLine size={20} className="text-[#26A5E4]" />
            </div>
            <span className="text-xs">Telegram</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-bg-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <RiMessage3Line size={20} className="text-[#25D366]" />
            </div>
            <span className="text-xs">WhatsApp</span>
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-bg-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center">
              {copied ? (
                <RiCheckLine size={20} className="text-success" />
              ) : (
                <RiLinkM size={20} />
              )}
            </div>
            <span className="text-xs">{copied ? t("copied") : t("copy_link")}</span>
          </button>

          {/* Native share (mobile) */}
          {"share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-bg-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center">
                <RiSendPlaneLine size={20} className="rotate-45" />
              </div>
              <span className="text-xs">{t("more")}</span>
            </button>
          )}
        </div>

        {/* Download branded */}
        <Button
          onClick={handleDownloadBranded}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          <span className="flex items-center justify-center gap-2">
            {generating ? (
              <span className="animate-spin inline-flex"><RiLoader4Line size={16} /></span>
            ) : (
              <RiDownloadLine size={16} />
            )}
            {t("download_branded")}
          </span>
        </Button>
      </div>
    </div>
  );
}
