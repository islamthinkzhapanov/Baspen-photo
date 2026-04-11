"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
  RiFolderLine,
} from "@remixicon/react";
import type { Album } from "@/hooks/useAlbums";

interface Props {
  albums: Album[];
  activeFilter: string | null; // null = all, "unsorted" = no album, uuid = specific album
  onFilterChange: (filter: string | null) => void;
  onCreateAlbum: (name: string) => void;
  onRenameAlbum: (albumId: string, name: string) => void;
  onDeleteAlbum: (albumId: string) => void;
  isOwner?: boolean;
}

export function AlbumStrip({
  albums,
  activeFilter,
  onFilterChange,
  onCreateAlbum,
  onRenameAlbum,
  onDeleteAlbum,
  isOwner = false,
}: Props) {
  const t = useTranslations("albums");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activeMenuId]);

  useEffect(() => {
    if (creating) createInputRef.current?.focus();
  }, [creating]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const totalPhotos = albums.reduce((sum, a) => sum + (a.photoCount ?? 0), 0);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateAlbum(trimmed);
    setNewName("");
    setCreating(false);
  }

  function handleRename(albumId: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onRenameAlbum(albumId, trimmed);
    setEditingId(null);
    setEditName("");
  }

  const chipBase =
    "h-8 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap";
  const chipActive = "border-primary bg-primary/10 text-primary";
  const chipInactive = "border-border hover:bg-bg-secondary text-text-secondary";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All photos */}
      <button
        onClick={() => onFilterChange(null)}
        className={`${chipBase} ${activeFilter === null ? chipActive : chipInactive}`}
      >
        {t("all_photos")}
      </button>

      {/* Unsorted */}
      <button
        onClick={() => onFilterChange("unsorted")}
        className={`${chipBase} ${activeFilter === "unsorted" ? chipActive : chipInactive}`}
      >
        {t("unsorted")}
      </button>

      {/* Album chips */}
      {albums.map((album) => (
        <div key={album.id} className="relative flex items-center gap-0.5" ref={activeMenuId === album.id ? menuRef : undefined}>
          {editingId === album.id ? (
            <div className="flex items-center gap-1">
              <input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(album.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-8 px-2 text-xs rounded-lg border border-primary bg-bg w-32 outline-none"
              />
              <button
                onClick={() => handleRename(album.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
              >
                <RiCheckLine size={14} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 text-text-secondary hover:bg-bg-secondary rounded cursor-pointer"
              >
                <RiCloseLine size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onFilterChange(album.id);
                if (isOwner) {
                  setActiveMenuId(activeMenuId === album.id ? null : album.id);
                }
              }}
              className={`${chipBase} ${activeFilter === album.id ? chipActive : chipInactive}`}
            >
              <RiFolderLine size={14} />
              {album.name}
              <span className="text-[10px] opacity-60">({album.photoCount})</span>
            </button>
          )}

          {/* Edit/Delete buttons - only for owners, visible on click */}
          {isOwner && activeMenuId === album.id && editingId !== album.id && (
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(album.id);
                  setEditName(album.name);
                  setActiveMenuId(null);
                }}
                className="p-1 text-text-secondary hover:text-text hover:bg-bg-secondary rounded cursor-pointer"
              >
                <RiEditLine size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAlbum(album.id);
                  setActiveMenuId(null);
                }}
                className="p-1 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
              >
                <RiDeleteBinLine size={12} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Create new album */}
      {isOwner && (
        <>
          {creating ? (
            <div className="flex items-center gap-1">
              <input
                ref={createInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                placeholder={t("album_name_placeholder")}
                className="h-8 px-2 text-xs rounded-lg border border-primary bg-bg w-36 outline-none"
              />
              <button
                onClick={handleCreate}
                className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
              >
                <RiCheckLine size={14} />
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
                className="p-1 text-text-secondary hover:bg-bg-secondary rounded cursor-pointer"
              >
                <RiCloseLine size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className={`${chipBase} ${chipInactive} border-dashed`}
            >
              <RiAddLine size={14} />
              {t("create_album")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
