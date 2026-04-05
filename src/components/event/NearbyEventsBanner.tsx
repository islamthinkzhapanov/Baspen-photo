"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useGeolocation } from "@/hooks/useGeolocation";
import { RiMapPinLine, RiCloseLine, RiArrowRightSLine } from "@remixicon/react";
import { Button } from "@tremor/react";
import { Link } from "@/i18n/navigation";

interface NearbyEvent {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  distance: number;
  photoCount: number;
  branding: { logo?: string; primaryColor?: string } | null;
}

/**
 * Auto-show banner when user is within geofence of a published event.
 * Uses Browser Geolocation API + /api/events/nearby endpoint.
 */
export function NearbyEventsBanner() {
  const t = useTranslations("geofence");
  const { latitude, longitude, requestLocation } = useGeolocation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [asked, setAsked] = useState(false);

  // Check for nearby events when location becomes available
  useEffect(() => {
    if (!latitude || !longitude) return;

    fetch(`/api/events/nearby?lat=${latitude}&lng=${longitude}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
      })
      .catch(() => {
        // Silently fail
      });
  }, [latitude, longitude]);

  // Don't show if dismissed or no events
  if (dismissed || events.length === 0) {
    // Show location prompt if not yet asked
    if (!asked && !latitude) {
      return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
          <div className="bg-bg rounded-2xl shadow-lg border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <RiMapPinLine size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t("enable_location")}</p>
              <p className="text-xs text-text-secondary">
                {t("enable_location_desc")}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setAsked(true);
                  requestLocation();
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("allow")}
              </button>
              <button
                onClick={() => setAsked(true)}
                className="p-1 hover:bg-bg-secondary rounded-full"
              >
                <RiCloseLine size={16} className="text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const event = events[0]; // Show closest event

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
      <div className="bg-bg rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: event.branding?.primaryColor
                ? `${event.branding.primaryColor}15`
                : "rgba(0,95,249,0.08)",
            }}
          >
            {event.branding?.logo ? (
              <img
                src={event.branding.logo}
                alt=""
                className="w-6 h-6 object-contain"
              />
            ) : (
              <RiMapPinLine size={20} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{event.title}</p>
            <p className="text-xs text-text-secondary">
              {t("distance_away", { km: event.distance })} ·{" "}
              {event.photoCount} {t("photos")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/e/${event.slug}`}
              className="flex items-center"
            >
              <Button size="xs" icon={RiArrowRightSLine} iconPosition="right">
                {t("view")}
              </Button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-bg-secondary rounded-full"
            >
              <RiCloseLine size={16} className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
