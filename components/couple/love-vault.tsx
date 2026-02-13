"use client";

import { useState, useRef } from "react";
import { Camera, Music, Share2, Upload, X } from "lucide-react";
import { AudioPlayer } from "./audio-player";

interface VaultData {
  favorite_song_url: string | null;
  favorite_song_title: string | null;
  favorite_song_artist: string | null;
  photo_1_url: string | null;
  photo_2_url: string | null;
  photo_3_url: string | null;
}

interface LoveVaultProps {
  vault: VaultData;
  partnerName: string;
  onUploadPhoto: (position: 1 | 2 | 3, file: File) => Promise<void>;
  onUploadSong: (file: File, title: string, artist: string) => Promise<void>;
  onRemovePhoto: (position: 1 | 2 | 3) => Promise<void>;
  onRemoveSong: () => Promise<void>;
}

export function LoveVault({
  vault,
  partnerName,
  onUploadPhoto,
  onUploadSong,
  onRemovePhoto,
  onRemoveSong,
}: LoveVaultProps) {
  const [songMeta, setSongMeta] = useState({ title: "", artist: "" });
  const [showSongForm, setShowSongForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [uploadingSong, setUploadingSong] = useState(false);

  const photos = [vault.photo_1_url, vault.photo_2_url, vault.photo_3_url];

  const handlePhotoClick = (position: 1 | 2 | 3) => {
    if (photos[position - 1]) {
      // Could open a full-screen viewer here
      return;
    }
    fileInputRef.current?.setAttribute("data-position", String(position));
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const position = parseInt(
      e.target.getAttribute("data-position") || "1",
    ) as 1 | 2 | 3;
    if (!file) return;

    setUploadingPhoto(position);
    await onUploadPhoto(position, file);
    setUploadingPhoto(null);
    e.target.value = "";
  };

  const handleSongSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !songMeta.title.trim()) return;

    setUploadingSong(true);
    await onUploadSong(file, songMeta.title, songMeta.artist);
    setUploadingSong(false);
    setShowSongForm(false);
    setSongMeta({ title: "", artist: "" });
    e.target.value = "";
  };

  const handleShare = async (platform: "whatsapp" | "instagram") => {
    const text = `Mira nuestro Baúl de Amor en Empatando`;
    const url = window.location.href;

    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        "_blank",
      );
    } else {
      // Instagram Stories — use Web Share API
      try {
        await navigator.share({
          title: "Baúl de Amor",
          text,
          url,
        });
      } catch {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Baúl de Amor
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleShare("whatsapp")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-colors"
            aria-label="Compartir en WhatsApp"
          >
            <Share2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleShare("instagram")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-pink-50 hover:text-pink-600 transition-colors"
            aria-label="Compartir en Instagram"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Song section */}
      {vault.favorite_song_url && vault.favorite_song_title ? (
        <div className="relative">
          <AudioPlayer
            src={vault.favorite_song_url}
            title={vault.favorite_song_title}
            artist={vault.favorite_song_artist || partnerName}
          />
          <button
            type="button"
            onClick={onRemoveSong}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
            aria-label="Quitar canción"
          >
            <X size={12} />
          </button>
        </div>
      ) : showSongForm ? (
        <div className="rounded-2xl bg-muted/50 border border-dashed border-primary/20 p-4 space-y-3">
          <input
            type="text"
            value={songMeta.title}
            onChange={(e) => setSongMeta((s) => ({ ...s, title: e.target.value }))}
            placeholder="Nombre de la canción"
            className="w-full rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            value={songMeta.artist}
            onChange={(e) => setSongMeta((s) => ({ ...s, artist: e.target.value }))}
            placeholder="Artista"
            className="w-full rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => songInputRef.current?.click()}
              disabled={!songMeta.title.trim() || uploadingSong}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary py-2 text-sm font-medium hover:bg-primary/20 disabled:opacity-50"
            >
              <Upload size={14} />
              {uploadingSong ? "Subiendo..." : "Subir audio"}
            </button>
            <button
              type="button"
              onClick={() => setShowSongForm(false)}
              className="px-3 rounded-xl text-muted-foreground hover:bg-muted text-sm"
            >
              Cancelar
            </button>
          </div>
          <input
            ref={songInputRef}
            type="file"
            accept="audio/*"
            onChange={handleSongSelected}
            className="hidden"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSongForm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-200 dark:border-pink-800 py-4 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        >
          <Music size={18} />
          Añadir canción favorita
        </button>
      )}

      {/* Photos grid — 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((pos) => {
          const photoUrl = photos[pos - 1];
          const isUploading = uploadingPhoto === pos;

          return (
            <div key={pos} className="relative">
              <button
                type="button"
                onClick={() => handlePhotoClick(pos as 1 | 2 | 3)}
                className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-border transition-colors hover:border-primary/30"
                aria-label={photoUrl ? `Foto ${pos}` : `Añadir foto ${pos}`}
              >
                {photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoUrl}
                    alt={`Foto de pareja ${pos}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {isUploading ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={20} className="text-muted-foreground" />
                    )}
                  </div>
                )}
              </button>

              {/* Remove button */}
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onRemovePhoto(pos as 1 | 2 | 3)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                  aria-label={`Quitar foto ${pos}`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden photo file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />
    </div>
  );
}
