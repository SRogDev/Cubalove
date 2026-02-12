"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/types";

interface MatchScreenProps {
  profile: UserProfile;
  onClose: () => void;
}

export const MatchScreen = ({ profile, onClose }: MatchScreenProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo match"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors safe-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Cerrar"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Animated heart */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-2xl shadow-primary/50 mb-6">
            <Heart size={40} fill="white" className="text-white" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-display text-4xl font-extrabold text-white text-center mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          &iexcl;Es un Match!
        </motion.h1>
        <motion.p
          className="text-white/70 text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          A {profile.display_name} también le gustas
        </motion.p>

        {/* Profile photo */}
        <motion.div
          className="h-28 w-28 rounded-full overflow-hidden border-4 border-primary shadow-xl mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.photos[0]?.url}
            alt={profile.display_name}
            className="h-full w-full object-cover"
            width={112}
            height={112}
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Button
            onClick={onClose}
            className="h-12 rounded-full gradient-primary text-white font-semibold shadow-lg shadow-primary/30"
          >
            <MessageCircle size={18} className="mr-2" aria-hidden="true" />
            Enviar mensaje
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="h-12 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            Seguir descubriendo
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
