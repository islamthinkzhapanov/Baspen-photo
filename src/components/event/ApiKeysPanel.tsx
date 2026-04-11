"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useTranslations } from "next-intl";
import {
  RiKeyLine,
  RiAddLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiCheckLine,
} from "@remixicon/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, TextInput, Card } from "@tremor/react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export function ApiKeysPanel({ eventId }: { eventId: string }) {
  const t = useTranslations("camera");
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ keys: ApiKey[] }>({
    queryKey: ["api-keys", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/api-keys`);
      if (!res.ok) throw new Error("Failed to load API keys");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/events/${eventId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      return res.json() as Promise<{ id: string; rawKey: string }>;
    },
    onSuccess: (data) => {
      setRevealedKey(data.rawKey);
      setShowCreate(false);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys", eventId] });
      toast.success(t("key_created"));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(
        `/api/events/${eventId}/api-keys?keyId=${keyId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to revoke key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", eventId] });
      toast.success(t("key_revoked"));
    },
  });

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeKeys = data?.keys?.filter((k) => !k.isRevoked) ?? [];

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <RiKeyLine size={20} />
          {t("title")}
        </h3>
        <Button
          onClick={() => setShowCreate(true)}
          icon={RiAddLine}
          size="sm"
        >
          {t("create_key")}
        </Button>
      </div>

      <p className="text-sm text-gray-500">{t("description")}</p>

      {/* Newly created key banner */}
      {revealedKey && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">
            {t("key_created_warning")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono break-all border">
              {revealedKey}
            </code>
            <button
              onClick={() => copyKey(revealedKey)}
              className="rounded p-2 hover:bg-green-100"
            >
              {copied ? (
                <RiCheckLine size={16} className="text-green-600" />
              ) : (
                <RiFileCopyLine size={16} className="text-green-600" />
              )}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="text-sm text-green-700 underline"
          >
            {t("dismiss")}
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="p-4 space-y-3">
          <TextInput
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t("key_name_placeholder")}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate(newKeyName || "Camera Key")}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t("creating") : t("create_key")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCreate(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </Card>
      )}

      {/* Usage example */}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t("usage_example")}
        </summary>
        <pre className="mt-3 overflow-x-auto rounded bg-gray-900 p-4 text-xs text-green-400">
{`# Upload a single photo
curl -X POST \\
  ${typeof window !== "undefined" ? window.location.origin : ""}/api/camera/upload \\
  -H "Authorization: Bearer bsp_YOUR_KEY" \\
  -F "file=@photo.jpg"

# Get presigned URLs for batch upload
curl -X POST \\
  "${typeof window !== "undefined" ? window.location.origin : ""}/api/camera/upload?mode=presigned" \\
  -H "Authorization: Bearer bsp_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"files":[{"name":"photo1.jpg","type":"image/jpeg","size":5000000}]}'

# Check photo processing status
curl "${typeof window !== "undefined" ? window.location.origin : ""}/api/camera/upload?photoId=PHOTO_ID" \\
  -H "Authorization: Bearer bsp_YOUR_KEY"`}
        </pre>
      </details>

      {/* Keys list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : activeKeys.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">
          {t("no_keys")}
        </p>
      ) : (
        <div className="space-y-2">
          {activeKeys.map((key) => (
            <Card
              key={key.id}
              className="flex items-center justify-between p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="font-mono text-xs text-gray-500">
                  {key.keyPrefix}...
                </p>
                {key.lastUsedAt && (
                  <p className="text-xs text-gray-400">
                    {t("last_used")}{" "}
                    {new Date(key.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setRevokeTarget(key.id)}
                className="rounded p-2 text-red-500 hover:bg-red-50"
              >
                <RiDeleteBinLine size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
    <ConfirmDialog
      open={!!revokeTarget}
      onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
      title={t("revoke_confirm_title")}
      description={t("revoke_confirm")}
      confirmText={t("revoke")}
      variant="danger"
      isPending={revokeMutation.isPending}
      onConfirm={() => {
        if (revokeTarget) {
          revokeMutation.mutate(revokeTarget, {
            onSuccess: () => setRevokeTarget(null),
          });
        }
      }}
    />
    </>
  );
}
