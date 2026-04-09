"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { RiFolderLine, RiAddLine } from "@remixicon/react";
import type { Album } from "@/hooks/useAlbums";

interface Props {
  albums: Album[];
  value: string | null;
  onChange: (albumId: string | null) => void;
  onCreateAlbum?: (name: string) => void;
  className?: string;
}

export function AlbumSelector({
  albums,
  value,
  onChange,
  onCreateAlbum,
  className = "",
}: Props) {
  const t = useTranslations("albums");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed || !onCreateAlbum) return;
    onCreateAlbum(trimmed);
    setNewName("");
    setShowCreate(false);
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <RiFolderLine size={16} className="text-text-secondary shrink-0" />
      <select
        value={value || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "__create__") {
            setShowCreate(true);
            return;
          }
          onChange(val || null);
        }}
        className="h-8 px-2 text-xs rounded-lg border border-border bg-bg hover:border-border-active transition-colors cursor-pointer outline-none min-w-[140px]"
      >
        <option value="">{t("no_album")}</option>
        {albums.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.photoCount})
          </option>
        ))}
        {onCreateAlbum && <option value="__create__">{t("create_new")}</option>}
      </select>

      {showCreate && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setShowCreate(false);
                setNewName("");
              }
            }}
            placeholder={t("album_name_placeholder")}
            className="h-8 px-2 text-xs rounded-lg border border-primary bg-bg w-36 outline-none"
          />
          <button
            onClick={handleCreate}
            className="h-8 px-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("create")}
          </button>
          <button
            onClick={() => {
              setShowCreate(false);
              setNewName("");
            }}
            className="h-8 px-2 text-xs font-medium rounded-lg border border-border hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
