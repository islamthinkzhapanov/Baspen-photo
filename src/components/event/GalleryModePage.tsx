"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import {
  RiCameraLine,
  RiHashtag,
  RiDownloadLine,
  RiCloseLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiHeartLine,
  RiFolder3Line,
  RiContactsLine,
  RiArrowDownDoubleLine,
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
    } | null;
    photoCount: number;
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

type MobileTab = "files" | "download" | "favorites" | "contacts";

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

  // Mobile favorites filter
  if (mobileTab === "favorites") {
    filteredPhotos = filteredPhotos.filter((p) => likes.has(p.id));
  }

  const searchPhotos = filteredPhotos.map(toSearchPhoto);

  function toggleLike(id: string) {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:px-20 md:pb-10">
          <div className="max-w-6xl mx-auto">
            {formattedDate && (
              <p className="text-white/80 text-xs md:text-[20px] md:leading-6 mb-2 md:mb-3">
                {formattedDate}
              </p>
            )}
            <h1
              className="text-white text-2xl md:text-[64px] md:leading-none font-medium tracking-[-1px]"
              style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif" }}
            >
              {event.title}
            </h1>
            {event.description && (
              <p className="text-white/80 text-xs md:text-[20px] mt-2 md:mt-3">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Mobile scroll hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden animate-bounce">
          <RiArrowDownDoubleLine className="w-6 h-6 text-white/70" />
        </div>
      </div>

      {/* Sticky Header with Album Tabs + Actions */}
      <div className="sticky top-0 z-30 bg-white border-b border-[rgba(0,16,61,0.12)]">
        <div className="max-w-6xl mx-auto px-4 md:px-20">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Album Tabs */}
            <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setActiveAlbumId(null); setMobileTab("files"); }}
                className={`whitespace-nowrap pb-4 md:pb-6 text-sm md:text-[20px] font-medium tracking-[-0.4px] border-b-3 transition-colors ${
                  activeAlbumId === null
                    ? "border-[#005ff9] text-[#28303f]"
                    : "border-transparent text-[rgba(40,48,63,0.6)] hover:text-[#28303f]"
                }`}
                style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
              >
                {t("all_albums")}
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => { setActiveAlbumId(album.id); setMobileTab("files"); }}
                  className={`whitespace-nowrap pb-4 md:pb-6 text-sm md:text-[20px] font-medium tracking-[-0.4px] border-b-3 transition-colors ${
                    activeAlbumId === album.id
                      ? "border-[#005ff9] text-[#28303f]"
                      : "border-transparent text-[rgba(40,48,63,0.6)] hover:text-[#28303f]"
                  }`}
                  style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
                >
                  {album.name.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Action Buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2.5">
              {searchMode && (
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-[15px] tracking-[-0.3px]"
                  style={{ fontWeight: 510 }}
                >
                  <RiCloseLine size={16} />
                  Сбросить поиск
                </button>
              )}
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#005ff9] text-white text-[15px] tracking-[-0.3px] hover:bg-[#0050d4] transition-colors"
                style={{ fontWeight: 510 }}
              >
                <img src="/icon-face.svg" alt="" className="w-[18px] h-[18px] invert" />
                {t("search_by_face")}
              </button>
              {bibSearchEnabled && (
                <button
                  onClick={() => setShowNumberSearch(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-[rgba(0,16,61,0.12)] bg-white text-[#28303f] text-[15px] tracking-[-0.3px] hover:bg-gray-50 transition-colors"
                  style={{ fontWeight: 510 }}
                >
                  <img src="/icon-number.svg" alt="" className="w-[18px] h-[18px]" />
                  {t("search_by_number")}
                </button>
              )}
              <button
                className="flex items-center gap-1 px-3.5 py-2.5 rounded-full border border-[rgba(0,16,61,0.12)] bg-white text-[#28303f] text-[15px] tracking-[-0.3px] hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 510 }}
              >
                {t("download_all_album")}
                <RiDownloadLine size={16} />
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
        <div className="max-w-6xl mx-auto px-4 md:px-20 pt-4">
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
        <div className="max-w-6xl mx-auto px-4 md:px-20 pt-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <span>Найдено {matchedPhotoIds.size} фото по вашему запросу</span>
            <button onClick={clearSearch} className="text-blue-600 hover:underline font-medium">
              Показать все фото
            </button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {!isSearching && (
        <div className="max-w-6xl mx-auto px-4 md:px-20 py-6 pb-24 md:pb-6">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[rgba(0,16,61,0.12)] md:hidden">
        <div className="flex items-center justify-around pt-2 pb-1">
          <button
            onClick={() => { setMobileTab("files"); setSearchMode(false); }}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <RiFolder3Line size={24} className={mobileTab === "files" ? "text-[#28303f]" : "text-[#28303f]/60"} />
            <span className={`text-xs ${mobileTab === "files" ? "text-[#28303f]" : "text-[#28303f]/60"}`}>
              {t("files_tab")}
            </span>
          </button>
          <button
            onClick={() => setShowCamera(true)}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <RiCameraLine size={24} className="text-[#28303f]/60" />
            <span className="text-xs text-[#28303f]/60">
              {t("search_by_face")}
            </span>
          </button>
          <button
            onClick={() => setMobileTab("favorites")}
            className="flex flex-col items-center gap-1 px-3 py-1 relative"
          >
            <RiHeartLine size={24} className={mobileTab === "favorites" ? "text-[#28303f]" : "text-[#28303f]/60"} />
            {likes.size > 0 && (
              <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {likes.size}
              </span>
            )}
            <span className={`text-xs ${mobileTab === "favorites" ? "text-[#28303f]" : "text-[#28303f]/60"}`}>
              {t("favorites_tab")}
            </span>
          </button>
          <button
            onClick={() => setMobileTab("contacts")}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <RiContactsLine size={24} className={mobileTab === "contacts" ? "text-[#28303f]" : "text-[#28303f]/60"} />
            <span className={`text-xs ${mobileTab === "contacts" ? "text-[#28303f]" : "text-[#28303f]/60"}`}>
              {t("contacts_tab")}
            </span>
          </button>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-[134px] h-[5px] bg-black rounded-full" />
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
                className="w-full py-4 bg-[#005ff9] text-white rounded-[6px] text-[15px] tracking-[-0.3px] hover:bg-[#0050d4] transition-colors"
                style={{ fontWeight: 510 }}
              >
                {t("search_by_number")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
