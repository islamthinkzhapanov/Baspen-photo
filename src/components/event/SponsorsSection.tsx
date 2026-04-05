"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiDraggable,
} from "@remixicon/react";
import {
  useSponsors,
  useCreateSponsor,
  useDeleteSponsor,
} from "@/hooks/useSponsors";
import { toast } from "sonner";
import { Card, Button, TextInput } from "@tremor/react";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  linkUrl: string | null;
  sortOrder: number;
}

export function SponsorsSection({ eventId }: { eventId: string }) {
  const t = useTranslations("sponsors");
  const tc = useTranslations("common");
  const { data: sponsors, isLoading } = useSponsors(eventId);
  const createSponsor = useCreateSponsor(eventId);
  const deleteSponsor = useDeleteSponsor(eventId);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !logoUrl) return;

    createSponsor.mutate(
      {
        name,
        logoUrl,
        linkUrl: linkUrl || undefined,
        sortOrder: (sponsors?.length || 0) + 1,
      },
      {
        onSuccess: () => {
          toast.success(tc("success"));
          setName("");
          setLogoUrl("");
          setLinkUrl("");
          setShowForm(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  function handleDelete(sponsor: Sponsor) {
    if (!confirm(t("delete_confirm", { name: sponsor.name }))) return;
    deleteSponsor.mutate(sponsor.id, {
      onError: (err: Error) => toast.error(err.message),
    });
  }

  if (isLoading) {
    return <div className="h-20 bg-bg-secondary rounded-xl animate-pulse" />;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{t("title")}</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          icon={RiAddLine}
        >
          {t("add_sponsor")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2">
          <TextInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
          />
          <TextInput
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder={t("logo_url")}
          />
          <TextInput
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={t("link_url")}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createSponsor.isPending}
              size="sm"
            >
              {tc("create")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              {tc("cancel")}
            </Button>
          </div>
        </form>
      )}

      {(!sponsors || sponsors.length === 0) && !showForm ? (
        <div className="text-center py-6 text-text-secondary text-sm">
          <p>{t("no_sponsors")}</p>
          <p className="text-xs mt-1">{t("no_sponsors_desc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sponsors?.map((sponsor: Sponsor) => (
            <div
              key={sponsor.id}
              className="flex items-center gap-3 py-2 px-3 bg-bg-secondary rounded-lg"
            >
              <RiDraggable size={16} className="text-text-secondary cursor-grab" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="w-10 h-10 object-contain rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {sponsor.name}
                </div>
                {sponsor.linkUrl && (
                  <a
                    href={sponsor.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                  >
                    <RiExternalLinkLine size={12} />
                    {new URL(sponsor.linkUrl).hostname}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(sponsor)}
                className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-bg rounded"
              >
                <RiDeleteBinLine size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
