"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  BookHeart,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoupleNav } from "@/components/layout/couple-nav";
import { CoupleLinkForm } from "@/components/couple/couple-link-form";
import { DailyChallenge } from "@/components/couple/daily-challenge";
import { LoveVault } from "@/components/couple/love-vault";
import { LoveDiaryModal } from "@/components/couple/love-diary-modal";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface CoupleRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  started_at: string;
  partner1: { user_id: string; display_name: string; user_photos: { url: string; position: number }[] };
  partner2: { user_id: string; display_name: string; user_photos: { url: string; position: number }[] };
}

interface DiaryEntry {
  id: string;
  content: string;
  entry_date: string;
  created_at: string;
  author: { user_id: string; display_name: string };
}

interface VaultData {
  favorite_song_url: string | null;
  favorite_song_title: string | null;
  favorite_song_artist: string | null;
  photo_1_url: string | null;
  photo_2_url: string | null;
  photo_3_url: string | null;
}

export default function ParejaPage() {
  const [room, setRoom] = useState<CoupleRoom | null>(null);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canWriteToday, setCanWriteToday] = useState(true);

  const { userId } = useCurrentUser();
  const supabase = createClient();

  const loadCoupleData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch active couple room
    const { data: roomData } = await supabase
      .from("couple_rooms")
      .select(`
        id,
        user1_id,
        user2_id,
        started_at,
        partner1:users!couple_rooms_user1_id_fkey (
          user_id, display_name, user_photos (url, position)
        ),
        partner2:users!couple_rooms_user2_id_fkey (
          user_id, display_name, user_photos (url, position)
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq("active", true)
      .maybeSingle();

    if (roomData) {
      setRoom(roomData as unknown as CoupleRoom);

      // Fetch vault
      const { data: vaultData } = await supabase
        .from("couple_vault")
        .select("*")
        .eq("room_id", roomData.id)
        .single();

      if (vaultData) setVault(vaultData as VaultData);

      // Fetch diary
      const { data: entries } = await supabase
        .from("couple_diary")
        .select(`
          id, content, entry_date, created_at,
          author:users!couple_diary_author_id_fkey (user_id, display_name)
        `)
        .eq("room_id", roomData.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: true });

      if (entries) setDiaryEntries(entries as unknown as DiaryEntry[]);

      // Check if user already wrote today
      const today = new Date().toISOString().split("T")[0];
      const wroteToday = entries?.some(
        (e) =>
          (e as unknown as DiaryEntry).author.user_id === userId &&
          (e as unknown as DiaryEntry).entry_date === today,
      );
      setCanWriteToday(!wroteToday);
    }

    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) loadCoupleData();
  }, [loadCoupleData, userId]);

  // Handler: send couple link request
  const handleSendRequest = async (phone: string, name: string) => {
    const { data: targetUser, error: findError } = await supabase
      .from("users")
      .select("user_id, display_name, phone")
      .eq("phone", phone)
      .ilike("display_name", name)
      .eq("status", "active")
      .maybeSingle();

    if (findError || !targetUser) {
      return { error: "No se encontró un usuario con ese nombre y teléfono." };
    }

    const { error: insertError } = await supabase
      .from("couple_requests")
      .insert({
        requester_id: userId!,
        target_id: targetUser.user_id,
        target_phone: phone,
        target_name: name,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Ya enviaste una solicitud a esta persona." };
      }
      return { error: "Error al enviar solicitud." };
    }

    return {};
  };

  // Handler: upload photo to vault
  const handleUploadPhoto = async (position: 1 | 2 | 3, file: File) => {
    if (!room) return;
    const path = `${room.id}/photo_${position}_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("couple-vault")
      .upload(path, file, { upsert: true });

    if (uploadError) return;

    const { data: urlData } = supabase.storage
      .from("couple-vault")
      .getPublicUrl(path);

    const field = `photo_${position}_url` as keyof VaultData;
    await supabase
      .from("couple_vault")
      .update({ [field]: urlData.publicUrl, updated_by: userId })
      .eq("room_id", room.id);

    setVault((v) => (v ? { ...v, [field]: urlData.publicUrl } : v));
  };

  // Handler: upload song
  const handleUploadSong = async (file: File, title: string, artist: string) => {
    if (!room) return;
    const path = `${room.id}/song_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("couple-vault")
      .upload(path, file, { upsert: true });

    if (uploadError) return;

    const { data: urlData } = supabase.storage
      .from("couple-vault")
      .getPublicUrl(path);

    await supabase
      .from("couple_vault")
      .update({
        favorite_song_url: urlData.publicUrl,
        favorite_song_title: title,
        favorite_song_artist: artist,
        updated_by: userId,
      })
      .eq("room_id", room.id);

    setVault((v) =>
      v
        ? {
          ...v,
          favorite_song_url: urlData.publicUrl,
          favorite_song_title: title,
          favorite_song_artist: artist,
        }
        : v,
    );
  };

  // Handler: remove photo
  const handleRemovePhoto = async (position: 1 | 2 | 3) => {
    if (!room) return;
    const field = `photo_${position}_url` as keyof VaultData;
    await supabase
      .from("couple_vault")
      .update({ [field]: null, updated_by: userId })
      .eq("room_id", room.id);

    setVault((v) => (v ? { ...v, [field]: null } : v));
  };

  // Handler: remove song
  const handleRemoveSong = async () => {
    if (!room) return;
    await supabase
      .from("couple_vault")
      .update({
        favorite_song_url: null,
        favorite_song_title: null,
        favorite_song_artist: null,
        updated_by: userId,
      })
      .eq("room_id", room.id);

    setVault((v) =>
      v
        ? {
          ...v,
          favorite_song_url: null,
          favorite_song_title: null,
          favorite_song_artist: null,
        }
        : v,
    );
  };

  // Handler: write diary entry
  const handleWriteDiaryEntry = async (content: string) => {
    if (!room) return;

    const { data: entry } = await supabase
      .from("couple_diary")
      .insert({
        room_id: room.id,
        author_id: userId!,
        content,
      })
      .select(`
        id, content, entry_date, created_at,
        author:users!couple_diary_author_id_fkey (user_id, display_name)
      `)
      .single();

    if (entry) {
      setDiaryEntries((prev) => [entry as unknown as DiaryEntry, ...prev]);
      setCanWriteToday(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get partner info
  const getPartner = () => {
    if (!room) return null;
    if (room.user1_id === userId) return room.partner2;
    return room.partner1;
  };

  const partner = getPartner();

  // Days together
  const daysTogether = room
    ? Math.floor(
      (Date.now() - new Date(room.started_at).getTime()) / (1000 * 60 * 60 * 24),
    )
    : 0;

  return (
    <>
      <div className="min-h-full pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/discover"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Volver a Conectar"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-lg font-bold flex items-center gap-1.5">
            <Heart size={18} className="text-primary" />
            Modo Pareja
          </h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* No couple — show link form */}
        {!room && <CoupleLinkForm onSubmit={handleSendRequest} />}

        {/* Active couple */}
        {room && vault && partner && (
          <div className="px-4 space-y-6">
            {/* Partner header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.user_photos?.[0]?.url || "/placeholder.png"}
                    alt={partner.display_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">
                    {partner.display_name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>
                      {daysTogether} {daysTogether === 1 ? "día" : "días"} juntos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Challenge */}
            <DailyChallenge roomId={room.id} />

            {/* Love Vault (Baúl de Amor) */}
            <LoveVault
              vault={vault}
              partnerName={partner.display_name}
              onUploadPhoto={handleUploadPhoto}
              onUploadSong={handleUploadSong}
              onRemovePhoto={handleRemovePhoto}
              onRemoveSong={handleRemoveSong}
            />

            {/* Diary button */}
            <button
              type="button"
              onClick={() => setDiaryOpen(true)}
              className="w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-pink-100 dark:border-pink-900/30 p-4 transition-colors hover:from-rose-100 hover:to-pink-100"
            >
              <BookHeart size={22} className="text-primary shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Diario de Amor</p>
                <p className="text-xs text-muted-foreground">
                  {diaryEntries.length} {diaryEntries.length === 1 ? "entrada" : "entradas"}
                  {canWriteToday && " · Puedes escribir hoy"}
                </p>
              </div>
              <Sparkles size={16} className="text-primary/50" />
            </button>
          </div>
        )}
      </div>

      {/* Couple mode navbar */}
      <CoupleNav />

      {/* Diary modal */}
      <LoveDiaryModal
        open={diaryOpen}
        onClose={() => setDiaryOpen(false)}
        entries={diaryEntries}
        currentUserId={userId ?? ""}
        canWriteToday={canWriteToday}
        onWriteEntry={handleWriteDiaryEntry}
      />
    </>
  );
}
