"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { RiFileCopyLine, RiCheckLine, RiCodeLine } from "@remixicon/react";
import { useWidget, useSaveWidget } from "@/hooks/useSponsors";
import { toast } from "sonner";
import {
  Card,
  Button,
  TextInput,
  NumberInput,
  Switch,
} from "@tremor/react";

export function WidgetSection({
  eventId,
  eventSlug,
}: {
  eventId: string;
  eventSlug: string;
}) {
  const t = useTranslations("widget");
  const tc = useTranslations("common");
  const { data: widget } = useWidget(eventId);
  const saveWidget = useSaveWidget(eventId);
  const [copied, setCopied] = useState(false);

  const [showBranding, setShowBranding] = useState(
    widget?.config?.showBranding ?? true
  );
  const [showSponsors, setShowSponsors] = useState(
    widget?.config?.showSponsors ?? true
  );
  const [maxWidth, setMaxWidth] = useState(
    widget?.config?.maxWidth || 800
  );
  const [customDomain, setCustomDomain] = useState(
    widget?.customDomain || ""
  );

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = `${baseUrl}/embed/${eventSlug}?branding=${showBranding}&sponsors=${showSponsors}`;

  const embedCode = useMemo(
    () =>
      `<iframe src="${embedUrl}" width="100%" height="600" style="max-width:${maxWidth}px;border:none;border-radius:12px;" allow="camera" loading="lazy"></iframe>`,
    [embedUrl, maxWidth]
  );

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success(t("code_copied"));
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    saveWidget.mutate(
      {
        customDomain: customDomain || undefined,
        config: { showBranding, showSponsors, maxWidth },
      },
      {
        onSuccess: () => toast.success(tc("success")),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <RiCodeLine size={20} className="text-primary" />
        <h2 className="font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        {/* Config */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-text-secondary block mb-1">
              {t("max_width")}
            </label>
            <NumberInput
              value={maxWidth}
              onValueChange={setMaxWidth}
              min={300}
              max={1920}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showBranding}
              onChange={setShowBranding}
            />
            <span className="text-sm">{t("show_branding")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showSponsors}
              onChange={setShowSponsors}
            />
            <span className="text-sm">{t("show_sponsors")}</span>
          </div>
        </div>

        {/* Custom domain */}
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            {t("custom_domain")}
          </label>
          <TextInput
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="photos.yourdomain.com"
          />
        </div>

        {/* Embed code */}
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            {t("embed_code")}
          </label>
          <div className="relative">
            <pre className="bg-bg-secondary rounded-lg p-3 text-xs overflow-x-auto text-text-secondary select-all">
              {embedCode}
            </pre>
            <button
              onClick={copyCode}
              className="absolute top-2 right-2 p-1.5 bg-bg rounded hover:bg-border"
            >
              {copied ? (
                <RiCheckLine size={16} className="text-success" />
              ) : (
                <RiFileCopyLine size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm text-text-secondary block mb-2">
            {t("preview")}
          </label>
          <div
            className="border border-border rounded-xl overflow-hidden"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <iframe
              src={embedUrl}
              width="100%"
              height="400"
              className="border-0"
              title="Widget preview"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saveWidget.isPending}
          size="sm"
        >
          {tc("save")}
        </Button>
      </div>
    </Card>
  );
}
