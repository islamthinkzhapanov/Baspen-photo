import { EventForm } from "@/components/event/EventForm";
import { getTranslations } from "next-intl/server";

export default async function NewEventPage() {
  const t = await getTranslations("events");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("new_event")}</h1>
      <EventForm />
    </div>
  );
}
