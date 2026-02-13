"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  HelpCircle,
  Camera,
  MapPin,
  Briefcase,
  Sparkles,
  MessageSquareQuote,
  ChevronRight,
  LogOut,
  Shield,
  Crown,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpModal } from "@/components/profile/help-modal";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { MOCK_PROFILES, getAge } from "@/lib/mock-data";

// Simulate current user as first mock profile
const currentUser = MOCK_PROFILES[0];

export default function ProfilePage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const age = getAge(currentUser.date_of_birth);

  return (
    <div className="min-h-full pb-6">
      {/* Header with settings and help */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="font-display text-xl font-bold">Mi Perfil</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ayuda"
          >
            <HelpCircle size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Configuración"
          >
            <Settings size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Profile photo + name */}
      <div className="flex flex-col items-center px-6 pb-6">
        <div className="relative mb-4">
          <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.photos[0]?.url}
              alt={currentUser.display_name}
              className="h-full w-full object-cover"
              width={112}
              height={112}
            />
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Cambiar foto de perfil"
          >
            <Camera size={14} aria-hidden="true" />
          </button>
        </div>

        <h2 className="font-display text-2xl font-bold">
          {currentUser.display_name}, {age}
        </h2>

        {currentUser.location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin size={14} aria-hidden="true" />
            <span>{currentUser.location.city}</span>
          </div>
        )}
      </div>

      {/* Photos grid */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Fotos
          </h3>
          <span className="text-xs text-muted-foreground">
            {currentUser.photos.length}/6
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const photo = currentUser.photos[i];
            return (
              <button
                key={i}
                type="button"
                className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={photo ? `Editar foto ${i + 1}` : `Añadir foto ${i + 1}`}
              >
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo.url}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover"
                    width={200}
                    height={300}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Camera size={20} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div className="px-4 mb-6">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Sobre mí
        </h3>
        <button
          type="button"
          className="w-full text-left rounded-2xl bg-muted/50 p-4 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Editar bio"
        >
          {currentUser.bio || (
            <span className="text-muted-foreground">
              Escribe algo sobre ti&hellip;
            </span>
          )}
        </button>
      </div>

      {/* Work/Study */}
      <div className="px-4 mb-6">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Trabajo / Estudio
        </h3>
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Editar trabajo o estudio"
        >
          <Briefcase size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">
            {currentUser.work_study || (
              <span className="text-muted-foreground">Añadir&hellip;</span>
            )}
          </span>
          <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
        </button>
      </div>

      {/* Prompts */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquareQuote size={14} className="text-primary" aria-hidden="true" />
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Prompts
          </h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => {
            const prompt = currentUser.prompts[i];
            return (
              <button
                key={i}
                type="button"
                className="w-full text-left rounded-2xl bg-muted/50 p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={prompt ? `Editar prompt ${i + 1}` : `Añadir prompt ${i + 1}`}
              >
                {prompt ? (
                  <>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {prompt.prompt_text}
                    </p>
                    <p className="text-sm font-medium">
                      &ldquo;{prompt.answer_text}&rdquo;
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Añadir un prompt&hellip;
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interests */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={14} className="text-primary" aria-hidden="true" />
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Intereses
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser.interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary"
            >
              {interest}
            </span>
          ))}
          <button
            type="button"
            className="inline-flex items-center rounded-full border-2 border-dashed border-primary/30 px-3.5 py-1.5 text-sm font-medium text-primary/60 hover:border-primary/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Añadir interés"
          >
            + Añadir
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 space-y-2 mb-6">
        <Link
          href="/premium"
          className="w-full flex items-center gap-3 rounded-2xl bg-gold/5 border border-gold/20 p-4 text-sm font-medium text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ver planes premium"
        >
          <Crown size={18} aria-hidden="true" />
          <span className="flex-1 text-left">Mejorar</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Configurar notificaciones"
        >
          <Bell size={18} className="text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-left text-muted-foreground">Notificaciones</span>
          <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
        </button>

        <Link
          href="/privacidad"
          className="w-full flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Privacidad y seguridad"
        >
          <Shield size={18} className="text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-left text-muted-foreground">Privacidad y seguridad</span>
          <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
        </Link>

        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="flex-1 text-left">Cerrar sesión</span>
        </button>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NotificationSettings open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
