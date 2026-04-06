import { EventForm } from "@/components/event/EventForm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NewEventPage() {
  const t = await getTranslations("events");
  const tc = await getTranslations("common");

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {tc("back")}
        </Link>
        <h1 className="text-2xl font-bold text-text">{t("new_event")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("new_event_desc")}</p>
      </div>
      <EventForm />
    </div>
  );
}
