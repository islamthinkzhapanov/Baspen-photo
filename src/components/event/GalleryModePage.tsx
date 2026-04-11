"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  RiCameraLine,
  RiHashtag,
  RiDownloadLine,
  RiCloseLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiFolder3Line,
  RiContactsLine,
  RiWhatsappFill,
} from "@remixicon/react";
import { useFaceSearch, type SearchPhoto } from "@/hooks/useSearch";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import { SelfieCamera } from "@/components/selfie/SelfieCamera";
import { PhotoMasonryGrid } from "@/components/event/PhotoMasonryGrid";
import { PhotoLightbox } from "@/components/event/PhotoLightbox";
import type { EmbedConfig } from "@/components/event/PublicEventPage";

interface GalleryPhoto {
  id: string;
  albumId: string | null;
  thumbnailPath: string | null;
  watermarkedPath: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface Album {
  id: string;
  name: string;
  sortOrder: number;
}

interface GalleryEventData {
  event: {
    id: string;
    title: string;
    description?: string | null;
    date?: string | null;
    location?: string | null;
    coverUrl?: string | null;
    branding?: { logo?: string; primaryColor?: string; bannerUrl?: string } | null;
    settings?: {
      freeDownload?: boolean;
      bibSearchEnabled?: boolean;
      displayMode?: string;
      retentionMonths?: number;
    } | null;
    photoCount: number;
    owner?: {
      name?: string | null;
      image?: string | null;
      phone?: string | null;
    } | null;
  };
  albums: Album[];
  photos: GalleryPhoto[];
}

// Convert gallery photo format to SearchPhoto format for shared components
function toSearchPhoto(p: GalleryPhoto): SearchPhoto {
  return {
    id: p.id,
    thumbnail_path: p.thumbnailPath,
    thumbnail_avif_path: null,
    watermarked_path: p.watermarkedPath,
    placeholder: null,
    width: p.width,
    height: p.height,
    created_at: p.createdAt,
    albumId: p.albumId,
  };
}

type MobileTab = "files" | "download" | "selected" | "contacts";

export function GalleryModePage({
  slug,
  embedConfig,
  eventData,
}: {
  slug: string;
  embedConfig?: EmbedConfig;
  eventData: GalleryEventData;
}) {
  const hideBranding = embedConfig ? !embedConfig.showBranding : false;
  const t = useTranslations("public");

  const { event, albums, photos } = eventData;
  const bibSearchEnabled = !!event.settings?.bibSearchEnabled;
  const isFreeDownload = !!event.settings?.freeDownload;

  // Album filter
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);

  // Lightbox
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Likes
  const [likes, setLikes] = useState<Set<string>>(new Set());

  // Search state
  const [showCamera, setShowCamera] = useState(false);
  const [showNumberSearch, setShowNumberSearch] = useState(false);
  const [bibNumber, setBibNumber] = useState(["", "", "", ""]);
  const bibRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [matchedPhotoIds, setMatchedPhotoIds] = useState<Set<string>>(new Set());
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mobile tab
  const [mobileTab, setMobileTab] = useState<MobileTab>("files");

  // Block right-click on images to prevent casual download
  const galleryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };
    el.addEventListener("contextmenu", handler);
    return () => el.removeEventListener("contextmenu", handler);
  }, []);

  const faceSearch = useFaceSearch();

  // Realtime match updates
  const { newPhotos } = useRealtimeMatches({
    eventId: event.id,
    sessionToken,
    enabled: !!sessionToken && searchMode,
  });

  // Filter photos
  let filteredPhotos = photos;
  if (activeAlbumId) {
    filteredPhotos = photos.filter((p) => p.albumId === activeAlbumId);
  }
  if (searchMode && matchedPhotoIds.size > 0) {
    const allMatchedIds = new Set([...matchedPhotoIds, ...newPhotos.map((p) => p.id)]);
    filteredPhotos = filteredPhotos.filter((p) => allMatchedIds.has(p.id));
  }

  // Mobile selected filter
  if (mobileTab === "selected") {
    filteredPhotos = filteredPhotos.filter((p) => likes.has(p.id));
  }

  const searchPhotos = useMemo(() => filteredPhotos.map(toSearchPhoto), [filteredPhotos]);

  const toggleLike = useCallback((id: string) => {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleFaceSearch(blob: Blob) {
    setShowCamera(false);
    setSearchError(null);
    setIsSearching(true);
    try {
      const result = await faceSearch.mutateAsync({
        file: blob,
        eventId: event.id,
        sessionToken: sessionToken || undefined,
      });
      if (result.error === "no_face_detected") {
        setSearchError("no_face_detected");
        setIsSearching(false);
        return;
      }
      setSessionToken(result.sessionToken);
      if (result.photos.length === 0) {
        setSearchError("no_results");
        setIsSearching(false);
      } else {
        setMatchedPhotoIds(new Set(result.photos.map((p) => p.id)));
        setSearchMode(true);
        setIsSearching(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSearchError(msg === "no_face_detected" ? "no_face_detected" : msg);
      setIsSearching(false);
    }
  }

  function handleNumberSearch() {
    const num = bibNumber.join("");
    if (!num) return;
    setShowNumberSearch(false);
    // Number search uses the existing API pattern
    // For gallery mode, we filter the already-loaded photos by bib number
    // This is a simplified version — full implementation would hit the search API
    setSearchMode(false);
  }

  function clearSearch() {
    setSearchMode(false);
    setMatchedPhotoIds(new Set());
    setSearchError(null);
  }

  // Clear favorites confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  function clearAllFavorites() {
    setLikes(new Set());
    setShowClearConfirm(false);
  }

  const downloadAsZip = useCallback(async (photoIds: string[], setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const res = await fetch("/api/photos/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: photoIds }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${event.title || "photos"}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setLoading(false);
    }
  }, [event.title]);

  async function downloadIndividually(ids: string[]) {
    for (const id of ids) {
      const res = await fetch(`/api/photos/${id}/download`);
      const data = await res.json();
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay so browser doesn't block multiple downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  function handleDownloadAll() {
    const ids = filteredPhotos.map((p) => p.id);
    downloadAsZip(ids, setIsDownloadingAll);
  }

  function handleDownloadFavorites() {
    const ids = Array.from(likes);
    if (ids.length > 10) {
      downloadAsZip(ids, setIsDownloadingSelected);
    } else {
      setIsDownloadingSelected(true);
      downloadIndividually(ids).finally(() => setIsDownloadingSelected(false));
    }
  }

  // Hero image: coverUrl > branding.bannerUrl > first photo thumbnail
  const heroImage =
    event.coverUrl ||
    event.branding?.bannerUrl ||
    (photos.length > 0 ? photos[0].thumbnailPath : null);

  // Format date
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  // Compute retention expiry date
  const retentionMonths = event.settings?.retentionMonths ?? 12;
  const retentionExpiry = event.date
    ? (() => {
        const d = new Date(event.date!);
        d.setMonth(d.getMonth() + retentionMonths);
        return d.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      })()
    : null;

  const owner = event.owner;
  const whatsappLink = owner?.phone
    ? `https://wa.me/${owner.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div ref={galleryRef} className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[65vh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:px-8 md:pb-12">
          <div>
            {formattedDate && (
              <p className="text-white/70 text-sm md:text-base font-medium tracking-wide mb-2 md:mb-3">
                {formattedDate}
              </p>
            )}
            <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-3">
              {retentionExpiry && (
                <span className="text-white/70 text-sm md:text-base">
                  {t("retention_until", { date: retentionExpiry })}
                </span>
              )}
              {retentionExpiry && owner?.name && (
                <span className="text-white/40">/</span>
              )}
              {owner?.name && (
                <div className="flex items-center gap-2">
                  {owner.image && (
                    <img
                      src={owner.image}
                      alt={owner.name}
                      className="w-6 h-6 rounded-full object-cover border border-white/30"
                    />
                  )}
                  <span className="text-white/70 text-sm md:text-base">
                    {t("photographer_label")}: {owner.name}
                  </span>
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <RiWhatsappFill size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Header with Album Tabs + Actions */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between gap-6">
            {/* Album Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
              <button
                onClick={() => { setActiveAlbumId(null); setMobileTab("files"); }}
                className={`whitespace-nowrap px-3 py-4 md:py-5 text-sm md:text-[15px] font-medium border-b-2 transition-colors ${
                  activeAlbumId === null
                    ? "border-primary text-text"
                    : "border-transparent text-text-secondary hover:text-text"
                }`}
              >
                {t("all_albums")}
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => { setActiveAlbumId(album.id); setMobileTab("files"); }}
                  className={`whitespace-nowrap px-3 py-4 md:py-5 text-sm md:text-[15px] font-medium border-b-2 transition-colors ${
                    activeAlbumId === album.id
                      ? "border-primary text-text"
                      : "border-transparent text-text-secondary hover:text-text"
                  }`}
                >
                  {album.name}
                </button>
              ))}
            </div>

            {/* Action Buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {searchMode && (
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <RiCloseLine size={16} />
                  Сбросить
                </button>
              )}
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <img src="/icon-face.svg" alt="" className="w-4 h-4 brightness-0 invert" />
                {t("search_by_face")}
              </button>
              {bibSearchEnabled && (
                <button
                  onClick={() => setShowNumberSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-text text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <img src="/icon-number.svg" alt="" className="w-4 h-4" />
                  {t("search_by_number")}
                </button>
              )}
              {likes.size > 0 && (
                <div className="relative group">
                  <button
                    onClick={handleDownloadFavorites}
                    disabled={isDownloadingSelected}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-text text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {isDownloadingSelected ? (
                      <RiLoader4Line size={16} className="animate-spin" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <RiCheckLine size={13} />
                      </span>
                    )}
                    {isDownloadingSelected ? "Скачивание..." : <>Скачать выбранные: {likes.size}</>}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700"
                  >
                    <RiCloseLine size={14} />
                  </button>
                </div>
              )}
              <button
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-text text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {isDownloadingAll ? (
                  <RiLoader4Line size={16} className="animate-spin" />
                ) : (
                  <RiDownloadLine size={16} />
                )}
                {isDownloadingAll ? "Упаковка фото..." : t("download_all_album")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Status */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RiLoader4Line size={32} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-text-secondary text-sm">Ищем ваши фото...</p>
          </div>
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className="px-4 md:px-8 pt-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <RiErrorWarningLine size={18} className="shrink-0" />
            <span>
              {searchError === "no_face_detected"
                ? "Лицо не обнаружено. Попробуйте ещё раз"
                : searchError === "no_results"
                ? "Совпадений не найдено"
                : `Ошибка: ${searchError}`}
            </span>
          </div>
        </div>
      )}

      {/* Search Mode Info */}
      {searchMode && !isSearching && (
        <div className="px-4 md:px-8 pt-4">
          <h2 className="text-sm font-medium text-gray-700">
            Найдено {matchedPhotoIds.size} фото по вашему запросу
          </h2>
        </div>
      )}

      {/* Photo Grid */}
      {!isSearching && (
        <div className="px-4 md:px-8 py-8 pb-28 md:pb-8">
          {searchPhotos.length > 0 ? (
            <PhotoMasonryGrid
              photos={searchPhotos}
              likes={likes}
              onToggleLike={toggleLike}
              onPhotoClick={setLightbox}
            />
          ) : (
            <div className="text-center py-16 text-text-secondary">
              {searchMode ? "Нет совпадений в этом альбоме" : "Нет фотографий"}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!hideBranding && (
        <div className="text-center py-6 text-xs text-text-secondary hidden md:block">
          {t("powered_by")}
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => { setMobileTab("files"); setSearchMode(false); }}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <RiFolder3Line size={22} className={mobileTab === "files" ? "text-primary" : "text-text-secondary"} />
            <span className={`text-[11px] font-medium ${mobileTab === "files" ? "text-primary" : "text-text-secondary"}`}>
              {t("files_tab")}
            </span>
          </button>
          <button
            onClick={() => setShowCamera(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <RiCameraLine size={22} className="text-text-secondary" />
            <span className="text-[11px] font-medium text-text-secondary">
              {t("search_by_face")}
            </span>
          </button>
          <button
            onClick={() => setMobileTab("selected")}
            className="flex flex-col items-center gap-0.5 px-4 py-1 relative"
          >
            <RiCheckboxCircleLine size={22} className={mobileTab === "selected" ? "text-primary" : "text-text-secondary"} />
            {likes.size > 0 && (
              <span className="absolute -top-0.5 right-2 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {likes.size}
              </span>
            )}
            <span className={`text-[11px] font-medium ${mobileTab === "selected" ? "text-primary" : "text-text-secondary"}`}>
              Выбранные
            </span>
          </button>
          <button
            onClick={() => setMobileTab("contacts")}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <RiContactsLine size={22} className={mobileTab === "contacts" ? "text-primary" : "text-text-secondary"} />
            <span className={`text-[11px] font-medium ${mobileTab === "contacts" ? "text-primary" : "text-text-secondary"}`}>
              {t("contacts_tab")}
            </span>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <PhotoLightbox
          photos={searchPhotos}
          currentIndex={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
          likes={likes}
          onToggleLike={toggleLike}
          isFreeDownload={isFreeDownload}
        />
      )}

      {/* Camera modal */}
      {showCamera && (
        <SelfieCamera
          onCapture={(blob) => handleFaceSearch(blob)}
          onClose={() => setShowCamera(false)}
          isSearching={faceSearch.isPending}
        />
      )}

      {/* Number search modal */}
      {showNumberSearch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-8">
            <button
              onClick={() => setShowNumberSearch(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <RiCloseLine size={20} className="text-gray-500" />
            </button>

            <div className="flex flex-col items-center">
              <RiHashtag size={40} className="text-primary/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">{t("search_by_number")}</h3>
              <p className="text-sm text-text-secondary mb-6">{t("enter_number")}</p>

              <div className="flex gap-3 mb-6">
                {bibNumber.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { bibRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    autoFocus={i === 0}
                    onChange={(e) => {
                      const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
                      const next = [...bibNumber];
                      next[i] = digit;
                      setBibNumber(next);
                      if (digit && i < 3) {
                        bibRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !bibNumber[i] && i > 0) {
                        bibRefs.current[i - 1]?.focus();
                      }
                    }}
                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
                    placeholder="_"
                  />
                ))}
              </div>

              <button
                onClick={handleNumberSearch}
                className="w-full py-3.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                {t("search_by_number")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear favorites confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] p-6">
            <h3 className="text-lg font-semibold mb-2">Сбросить выбор?</h3>
            <p className="text-sm text-text-secondary mb-6">
              Вы уверены, что хотите снять выбор со всех фотографий ({likes.size} шт.)?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={clearAllFavorites}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
