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
  RiMore2Line,
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

  const tabBase =
    "px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer whitespace-nowrap";
  const tabActive = "bg-bg text-text font-medium shadow-sm";
  const tabInactive = "text-text-secondary hover:text-text";

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      <div className="flex bg-bg-secondary rounded-lg p-1 gap-0.5 items-center">
        {/* All photos */}
        <button
          onClick={() => onFilterChange(null)}
          className={`${tabBase} ${activeFilter === null ? tabActive : tabInactive}`}
        >
          {t("all_photos")}
        </button>

        {/* Unsorted */}
        <button
          onClick={() => onFilterChange("unsorted")}
          className={`${tabBase} ${activeFilter === "unsorted" ? tabActive : tabInactive}`}
        >
          {t("unsorted")}
        </button>

        {/* Album tabs */}
        {albums.map((album) => (
          <div key={album.id} className="relative flex items-center" ref={activeMenuId === album.id ? menuRef : undefined}>
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
                  className="h-7 px-2 text-xs rounded-md border border-primary bg-bg w-32 outline-none"
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
              <div className="flex items-center">
                <button
                  onClick={() => onFilterChange(album.id)}
                  className={`${tabBase} flex items-center gap-1.5 ${activeFilter === album.id ? tabActive : tabInactive}`}
                >
                  <RiFolderLine size={14} />
                  {album.name}
                  <span className="text-[10px] opacity-60">({album.photoCount})</span>
                </button>

                {/* Three-dot menu for owners — only on active tab */}
                {isOwner && activeFilter === album.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === album.id ? null : album.id);
                    }}
                    className="p-0.5 text-text-secondary hover:text-text rounded transition-colors cursor-pointer"
                  >
                    <RiMore2Line size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Dropdown menu */}
            {isOwner && activeMenuId === album.id && editingId !== album.id && (
              <div className="absolute top-full left-0 mt-1 bg-bg border border-border rounded-lg shadow-lg z-50 min-w-[140px] py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(album.id);
                    setEditName(album.name);
                    setActiveMenuId(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-secondary transition-colors w-full text-left cursor-pointer"
                >
                  <RiEditLine size={14} />
                  {t("rename")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAlbum(album.id);
                    setActiveMenuId(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                >
                  <RiDeleteBinLine size={14} />
                  {t("delete")}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Create new album */}
        {isOwner && (
          <>
            {creating ? (
              <div className="flex items-center gap-1 ml-0.5">
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
                  className="h-7 px-2 text-xs rounded-md border border-primary bg-bg w-36 outline-none"
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
                className={`${tabBase} ${tabInactive} flex items-center gap-1.5`}
              >
                <RiAddLine size={14} />
                {t("create_album")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
