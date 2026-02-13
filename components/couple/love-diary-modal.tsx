"use client";

import { useState } from "react";
import { X, BookHeart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiaryEntry {
  id: string;
  content: string;
  entry_date: string;
  created_at: string;
  author: {
    user_id: string;
    display_name: string;
  };
}

interface LoveDiaryModalProps {
  open: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  currentUserId: string;
  canWriteToday: boolean;
  onWriteEntry: (content: string) => Promise<void>;
}

export function LoveDiaryModal({
  open,
  onClose,
  entries,
  currentUserId,
  canWriteToday,
  onWriteEntry,
}: LoveDiaryModalProps) {
  const [newEntry, setNewEntry] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!newEntry.trim() || sending) return;
    setSending(true);
    await onWriteEntry(newEntry.trim());
    setNewEntry("");
    setSending(false);
  };

  // Group entries by date
  const grouped = entries.reduce(
    (acc, entry) => {
      const date = entry.entry_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    },
    {} as Record<string, DiaryEntry[]>,
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <BookHeart size={20} className="text-primary" />
          <h2 className="font-display text-lg font-bold">Diario de Amor</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12">
            <BookHeart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              Aún no hay entradas en el diario.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Escribe algo bonito para empezar.
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([date, dayEntries]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {formatDate(date)}
            </p>
            <div className="space-y-3">
              {dayEntries.map((entry) => {
                const isOwn = entry.author.user_id === currentUserId;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-2xl p-4 ${
                      isOwn
                        ? "bg-primary/5 border border-primary/10 ml-4"
                        : "bg-muted/50 border border-border/50 mr-4"
                    }`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {entry.author.display_name}
                    </p>
                    <p className="text-sm leading-relaxed">{entry.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Write entry */}
      {canWriteToday && (
        <div className="border-t px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Escribe en el diario..."
              maxLength={500}
              className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleSubmit}
              disabled={!newEntry.trim() || sending}
              size="icon"
              className="rounded-full h-10 w-10 gradient-primary text-white"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            1 mensaje por día ({newEntry.length}/500)
          </p>
        </div>
      )}
    </div>
  );
}
