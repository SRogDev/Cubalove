"use client";

import { useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { ChismeCard } from "@/components/chismes/chisme-card";
import { MOCK_CHISMES } from "@/lib/mock-data";

export default function ChismesPage() {
  const [chismes] = useState(MOCK_CHISMES);

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame size={22} className="text-primary" aria-hidden="true" />
          <h1 className="font-display text-xl font-bold">Chismes</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lo último de la comunidad
        </p>
      </div>

      {/* Highlighted tip */}
      <div className="px-4 mb-4">
        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
          <Sparkles
            size={18}
            className="text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-primary/90 leading-relaxed">
            Explora los chismes de la comunidad. Dale like a los que te gusten y
            comparte con tus amistades.
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 space-y-4">
        {chismes.map((chisme, i) => (
          <ChismeCard key={chisme.id} chisme={chisme} index={i} />
        ))}

        {/* End of feed */}
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Eso es todo por ahora. Vuelve pronto para más chismes.
          </p>
        </div>
      </div>
    </div>
  );
}
