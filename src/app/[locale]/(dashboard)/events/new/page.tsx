import { EventForm } from "@/components/event/EventForm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NewEventPage() {
  const t = await getTranslations("events");
  const tc = await getTranslations("common");

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm mb-3">
          <Link
            href="/events"
            className="text-text-secondary hover:text-text transition-colors"
          >
            {t("title")}
          </Link>
          <span className="text-text-secondary">/</span>
          <span className="text-text font-medium">{t("new_event")}</span>
        </nav>
        <h1 className="text-2xl font-bold text-text">{t("new_event")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("new_event_desc")}</p>
      </div>
      <EventForm />
    </div>
  );
}
