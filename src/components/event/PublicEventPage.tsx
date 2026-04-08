"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
import {
  RiCameraLine,
  RiHashtag,
  RiImageLine,
  RiArrowLeftLine,
  RiDownloadLine,
  RiShareLine,
  RiHeartLine,
  RiHeartFill,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiLoader4Line,
  RiErrorWarningLine,
} from "@remixicon/react";
import { Button } from "@tremor/react";
import { ShineBorder } from "@/components/ui/shine-border";
import { useQuery } from "@tanstack/react-query";
import { useFaceSearch, type SearchPhoto } from "@/hooks/useSearch";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import { SelfieCamera } from "@/components/selfie/SelfieCamera";

// Color palette for placeholder photos
const photoColors = [
  "from-blue-200 to-blue-300",
  "from-emerald-200 to-emerald-300",
  "from-amber-200 to-amber-300",
  "from-violet-200 to-violet-300",
  "from-rose-200 to-rose-300",
  "from-cyan-200 to-cyan-300",
  "from-orange-200 to-orange-300",
  "from-indigo-200 to-indigo-300",
  "from-teal-200 to-teal-300",
  "from-pink-200 to-pink-300",
  "from-sky-200 to-sky-300",
  "from-lime-200 to-lime-300",
];

export interface EmbedConfig {
  showBranding: boolean;
  showSponsors: boolean;
}

type View = "landing" | "searching" | "results";

// --- Main Component ---

export function PublicEventPage({
  slug,
  embedConfig,
}: {
  slug: string;
  embedConfig?: EmbedConfig;
}) {
  const hideBranding = embedConfig ? !embedConfig.showBranding : false;
  const t = useTranslations("public");
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const [view, setView] = useState<View>("landing");
  const [showCamera, setShowCamera] = useState(false);
  const [showNumberSearch, setShowNumberSearch] = useState(false);
  const [bibNumber, setBibNumber] = useState(["", "", "", ""]);
  const bibRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [likes, setLikes] = useState<Set<string>>(new Set());

  // --- Real search state ---
  const [matchedPhotos, setMatchedPhotos] = useState<SearchPhoto[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [numberSearchQuery, setNumberSearchQuery] = useState("");

  const faceSearch = useFaceSearch();

  const { data: eventData } = useQuery({
    queryKey: ["public-event", slug, isPreview],
    queryFn: async () => {
      const url = isPreview
        ? `/api/events/by-slug/${slug}?preview=true`
        : `/api/events/by-slug/${slug}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  // Number search via API
  const { data: numberData } = useQuery({
    queryKey: ["search", "number", eventData?.event?.id, numberSearchQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/search/number?eventId=${eventData.event.id}&number=${encodeURIComponent(numberSearchQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ photos: SearchPhoto[]; total: number }>;
    },
    enabled: !!eventData?.event?.id && !!numberSearchQuery && numberSearchQuery.length >= 1,
  });

  // Realtime match updates after face search
  const { newPhotos } = useRealtimeMatches({
    eventId: eventData?.event?.id || "",
    sessionToken,
    enabled: !!sessionToken && view === "results",
  });

  const event = eventData?.event || {
    title: "",
    description: "",
    date: null,
    location: "",
    photoCount: 0,
    participantCount: 0,
    settings: null as Record<string, unknown> | null,
  };

  const bibSearchEnabled = !!event.settings?.bibSearchEnabled;

  // Combine matched photos with realtime new matches
  const searchResults: SearchPhoto[] = numberSearchQuery
    ? (numberData?.photos || [])
    : [...newPhotos.filter((np) => !matchedPhotos.some((mp) => mp.id === np.id)), ...matchedPhotos];

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
    setView("searching");
    setNumberSearchQuery("");
    try {
      const result = await faceSearch.mutateAsync({
        file: blob,
        eventId: event.id,
        sessionToken: sessionToken || undefined,
      });
      if (result.error === "no_face_detected") {
        setSearchError("no_face_detected");
        setView("landing");
        return;
      }
      setMatchedPhotos(result.photos);
      setSessionToken(result.sessionToken);
      if (result.photos.length === 0) {
        setSearchError("no_results");
        setView("landing");
      } else {
        setView("results");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "no_face_detected") {
        setSearchError("no_face_detected");
      } else {
        setSearchError(msg);
      }
      setView("landing");
    }
  }

  function handleNumberSearch() {
    const num = bibNumber.join("");
    if (!num) return;
    setShowNumberSearch(false);
    setSearchError(null);
    setMatchedPhotos([]);
    setNumberSearchQuery(num);
    setView("results");
  }

  // --- Searching View ---
  if (view === "searching") {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-bg`}>
        <div className="text-center" style={{ opacity: 0, animation: "fade-in 0.4s ease-out forwards" }}>
          <span className="animate-spin inline-flex mx-auto mb-3"><RiLoader4Line size={40} className="text-primary" /></span>
          <p className={`font-medium text-text-secondary`}>{t("searching")}</p>
          <p className={`text-xs mt-1 text-text-secondary`} style={{ opacity: 0, animation: "fade-in-up 0.4s ease-out 0.2s forwards" }}>
            Анализируем {fmt(event.photoCount)} фото...
          </p>
        </div>
      </div>
    );
  }

  // --- Results View ---
  if (view === "results") {
    const likedCount = likes.size;

    return (
      <div className={`min-h-screen bg-bg`}>
        {/* Header */}
        <div className={`sticky top-0 z-30 backdrop-blur border-b bg-white/90 border-border`}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setView("landing")}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text"
            >
              <RiArrowLeftLine size={16} />
              {event.title}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCamera(true)}
                className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary"
                title={t("search_by_face")}
              >
                <RiCameraLine size={16} />
              </button>
              {bibSearchEnabled && (
                <button
                  onClick={() => setShowNumberSearch(true)}
                  className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary"
                  title={t("search_by_number")}
                >
                  <RiHashtag size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5" style={{ opacity: 0, animation: "fade-in-up 0.4s ease-out 0.1s forwards" }}>
            <div>
              <h2 className="text-lg font-bold">{t("results", { count: searchResults.length })}</h2>
              <p className="text-xs text-text-secondary mt-0.5">{t("found_photos")}</p>
            </div>
            <div className="flex gap-2">
              {likedCount > 0 && (
                <Button size="xs" icon={RiDownloadLine}>
                  Купить выбранные ({likedCount})
                </Button>
              )}
              <Button variant="secondary" size="xs" icon={RiDownloadLine}>
                {t("download_all")}
              </Button>
            </div>
          </div>

          {/* Masonry Grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {searchResults.map((photo, index) => {
              const isLiked = likes.has(photo.id);
              const staggerDelay = Math.min(index * 40, 400);
              const imgSrc = photo.watermarked_path || photo.thumbnail_path;
              return (
                <div
                  key={photo.id}
                  className="mb-3 break-inside-avoid group relative"
                  style={{
                    opacity: 0,
                    animation: `masonry-fade-in 0.5s ease-out ${staggerDelay}ms forwards`,
                  }}
                >
                  <div
                    className="bg-gray-100 rounded-xl overflow-hidden cursor-pointer relative"
                    style={{ aspectRatio: `${photo.width || 4}/${photo.height || 3}` }}
                    onClick={() => setLightbox(index)}
                  >
                    {/* Watermark overlay */}
                    {!hideBranding && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
                        <span className="text-4xl font-bold text-black -rotate-30 select-none">
                          BASPEN
                        </span>
                      </div>
                    )}

                    {/* Photo content */}
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RiImageLine size={32} className="text-white/30" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(photo.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur ${
                        isLiked
                          ? "bg-red-500 text-white"
                          : "bg-white/80 text-text-secondary hover:text-red-500"
                      }`}
                    >
                      {isLiked ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-text-secondary hover:text-primary"
                    >
                      <RiShareLine size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Purchase CTA */}
          {searchResults.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 text-center" style={{ opacity: 0, animation: "fade-in-up 0.5s ease-out 0.6s forwards" }}>
              <h3 className="text-lg font-bold mb-1">{t("download_your_photos")}</h3>
              <div className="flex gap-3 justify-center mt-4">
                {likedCount > 0 && (
                  <Button variant="secondary" size="xs">
                    {t("selected")} ({likedCount})
                  </Button>
                )}
                <Button size="xs" icon={RiDownloadLine}>
                  {t("download_all")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!hideBranding && (
          <div className={`text-center py-6 text-xs text-text-secondary`}>
            {t("powered_by")}
          </div>
        )}

        {/* Lightbox */}
        {lightbox !== null && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" style={{ animation: "fade-in 0.2s ease-out" }}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <RiCloseLine size={20} className="text-white" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {lightbox + 1} / {searchResults.length}
            </div>

            {/* Nav */}
            {lightbox > 0 && (
              <button
                onClick={() => setLightbox(lightbox - 1)}
                className="absolute left-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <RiArrowLeftSLine size={24} className="text-white" />
              </button>
            )}
            {lightbox < searchResults.length - 1 && (
              <button
                onClick={() => setLightbox(lightbox + 1)}
                className="absolute right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <RiArrowRightSLine size={24} className="text-white" />
              </button>
            )}

            {/* Photo */}
            <div
              className="rounded-xl max-w-3xl w-full mx-8 overflow-hidden"
              style={{
                aspectRatio: `${searchResults[lightbox].width || 4}/${searchResults[lightbox].height || 3}`,
                maxHeight: "80vh",
              }}
            >
              <div className="w-full h-full flex items-center justify-center relative">
                {searchResults[lightbox].watermarked_path || searchResults[lightbox].thumbnail_path ? (
                  <img
                    src={searchResults[lightbox].watermarked_path || searchResults[lightbox].thumbnail_path || undefined}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <RiImageLine size={64} className="text-white/20" />
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={() => toggleLike(searchResults[lightbox].id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur text-sm ${
                  likes.has(searchResults[lightbox].id)
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {likes.has(searchResults[lightbox].id) ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
                {likes.has(searchResults[lightbox].id) ? "В избранном" : "В избранное"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur text-sm">
                <RiShareLine size={16} />
                Поделиться
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-hover text-sm">
                <RiDownloadLine size={16} />
                {t("download")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Landing View ---

  const decoPhotos = [
    { src: "/deco-01.jpg", left: "67%", top: "5%", rotate: 30 },
    { src: "/deco-06.jpg", left: "13%", top: "5%", rotate: -30 },
    { src: "/deco-04.jpg", left: "82%", top: "30%", rotate: 30 },
    { src: "/deco-08.jpg", left: "-2%", top: "35%", rotate: -30 },
    { src: "/deco-02.jpg", left: "67%", top: "55%", rotate: 30 },
    { src: "/deco-05.jpg", left: "13%", top: "55%", rotate: -30 },
    { src: "/deco-03.jpg", left: "88%", top: "68%", rotate: 30 },
    { src: "/deco-07.jpg", left: "-7%", top: "68%", rotate: -30 },
  ];

  const rainbowOverlay =
    "linear-gradient(90deg, rgba(38,192,255,0.4) 0%, rgba(230,0,194,0.4) 20%, rgba(255,73,78,0.4) 40%, rgba(255,161,62,0.4) 60%, rgba(255,200,55,0.4) 80%, rgba(0,204,61,0.4) 100%)";

  return (
    <div className={`relative h-screen flex items-center justify-center overflow-hidden bg-white`}>
      {/* Background container with gradient + rainbow beams */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(3,110,167,0.01), rgba(255,255,255,0.2))",
        }}
      >
        {/* Rainbow beams image */}
        <img
          src="/rainbow-beams.webp"
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100vw] min-h-[100vh] max-w-none object-cover opacity-80 pointer-events-none"
        />

        {/* Decorative scattered photos */}
        {decoPhotos.map((photo, i) => (
          <div
            key={i}
            className="absolute hidden md:flex items-center justify-center"
            style={{
              left: photo.left,
              top: photo.top,
              width: 200,
              height: 200,
            }}
          >
            <div
              className="w-[200px] h-[200px] rounded-[14px] opacity-50 overflow-hidden relative"
              style={{ transform: `rotate(${photo.rotate}deg)` }}
            >
              <div className="absolute inset-0 bg-white rounded-[14px]" />
              <img
                src={photo.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-[14px]"
              />
              <div
                className="absolute inset-0 rounded-[14px] mix-blend-lighten"
                style={{ backgroundImage: rainbowOverlay }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Central white card with ShineBorder */}
      <ShineBorder
        borderRadius={24}
        borderWidth={3}
        duration={10}
        color={["#26c0ff", "#e600c2", "#ff494e", "#ffa13e", "#ffc837", "#00cc3d"]}
        className={`relative z-10 w-full max-w-[600px] rounded-t-[24px] overflow-hidden bg-[#fcfcfc]`}
      >
        <div
          className="w-full flex flex-col items-center pb-[120px]"
        >
        {/* Logo */}
        {!hideBranding && (
          <div className="mt-[50px] mb-[80px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-baspen.svg"
              alt="Baspen"
              className="h-[24px] w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(15%) sepia(20%) saturate(800%) hue-rotate(175deg)" }}
            />
          </div>
        )}
        {hideBranding && <div className="mt-[50px] mb-[80px]" />}

        {/* Headline */}
        <div className={`text-center px-6 mb-6 text-[#2c2d2e]`}>
          <p
            className="text-[28px] sm:text-[42px] leading-none tracking-[-1px]"
            style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
          >
            Быстрый поиск ваших
          </p>
          <p
            className="text-[36px] sm:text-[52px] leading-[50px] tracking-[-3.8px] italic font-bold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            фотографии
          </p>
          <p
            className="text-[28px] sm:text-[42px] leading-none tracking-[-1px]"
            style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
          >
            с использованием ИИ
          </p>
        </div>

        {/* Subtitle */}
        <p className={`text-[15px] text-center leading-[18px] tracking-[-0.3px] mb-10 px-6 text-[#7b7b7b]`}>
          Используйте поиск по номеру, если ваше лицо
          <br />
          было закрыто аксессуарами
        </p>

        {/* Search error */}
        {searchError && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 mx-6 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <RiErrorWarningLine size={18} className="shrink-0" />
            <span>
              {searchError === "no_face_detected"
                ? "Лицо не обнаружено. Попробуйте ещё раз"
                : searchError === "no_results"
                ? "Совпадений не найдено"
                : `Ошибка: ${searchError}`}
            </span>
          </div>
        )}

        {/* Search buttons */}
        <div className="flex flex-col gap-[14px] w-full max-w-[400px] px-6">
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center justify-center gap-2 w-full py-4 px-[14px] bg-[#005ff9] text-white rounded-[6px] text-[15px] tracking-[-0.3px] hover:bg-[#0050d4] transition-colors"
            style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
          >
            <img src="/icon-face.svg" alt="" className="w-[18px] h-[18px]" />
            {t("search_by_face")}
          </button>
          {bibSearchEnabled && (
            <button
              onClick={() => setShowNumberSearch(true)}
              className="flex items-center justify-center gap-2 w-full py-4 px-[14px] border rounded-[6px] text-[15px] tracking-[-0.3px] transition-colors bg-white border-[rgba(0,16,61,0.12)] text-[#08304c] hover:bg-gray-50"
              style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 510 }}
            >
              <img src="/icon-number.svg" alt="" className="w-[18px] h-[18px]" />
              {t("search_by_number")}
            </button>
          )}
        </div>

        {/* Footer */}
        {!hideBranding && (
          <div className="mt-auto pb-6 pt-8">
            <p className={`text-[15px] text-center tracking-[-0.3px] text-[rgba(8,48,76,0.7)]`}>
              {new Date().getFullYear()}. All rights reserved
            </p>
          </div>
        )}
        </div>
      </ShineBorder>

      {/* Camera modal overlay */}
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
