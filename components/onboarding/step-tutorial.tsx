"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowLeft, Loader2, Heart, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    onComplete: () => void;
    onBack: () => void;
    submitting: boolean;
}

// Fake profile card for the tutorial
function TutorialCard({
    onSwipeComplete,
}: {
    onSwipeComplete: (dir: "left" | "right" | "up") => void;
}) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
    const superLikeOpacity = useTransform(y, [-100, 0], [1, 0]);

    const handleDragEnd = (
        _: unknown,
        info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
    ) => {
        const swipeThreshold = 100;

        if (info.offset.y < -swipeThreshold) {
            animate(y, -500, { duration: 0.3 });
            setTimeout(() => onSwipeComplete("up"), 300);
        } else if (info.offset.x > swipeThreshold) {
            animate(x, 500, { duration: 0.3 });
            setTimeout(() => onSwipeComplete("right"), 300);
        } else if (info.offset.x < -swipeThreshold) {
            animate(x, -500, { duration: 0.3 });
            setTimeout(() => onSwipeComplete("left"), 300);
        } else {
            animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
            animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
        }
    };

    return (
        <motion.div
            drag
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            style={{ x, y, rotate }}
            className="relative w-full aspect-[3/4] rounded-2xl bg-gradient-to-b from-pink-400 to-primary shadow-xl cursor-grab active:cursor-grabbing overflow-hidden select-none"
        >
            {/* Fake photo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-7xl mb-4">🤳</span>
                <p className="text-2xl font-bold">Ejemplo, 24</p>
                <p className="text-sm opacity-80 mt-1">La Habana</p>
            </div>

            {/* LIKE overlay */}
            <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-6 left-6 border-4 border-green-400 text-green-400 px-4 py-1 rounded-lg text-2xl font-black -rotate-12"
            >
                LIKE
            </motion.div>

            {/* NOPE overlay */}
            <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-6 right-6 border-4 border-red-400 text-red-400 px-4 py-1 rounded-lg text-2xl font-black rotate-12"
            >
                NOPE
            </motion.div>

            {/* SUPER LIKE overlay */}
            <motion.div
                style={{ opacity: superLikeOpacity }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 border-4 border-blue-400 text-blue-400 px-4 py-1 rounded-lg text-2xl font-black"
            >
                SUPER ⭐
            </motion.div>
        </motion.div>
    );
}

export function StepTutorial({ onComplete, onBack, submitting }: Props) {
    const [phase, setPhase] = useState<"intro" | "practice" | "done">("intro");
    const [swipesDone, setSwipesDone] = useState<string[]>([]);
    const [cardKey, setCardKey] = useState(0);

    const handleSwipe = (dir: "left" | "right" | "up") => {
        const newSwipes = [...swipesDone, dir];
        setSwipesDone(newSwipes);

        // Show a new card after a brief delay
        setTimeout(() => {
            if (newSwipes.length >= 3) {
                setPhase("done");
            } else {
                setCardKey((k) => k + 1);
            }
        }, 400);
    };

    const SWIPE_LABELS: Record<string, string> = {
        right: "👉 Derecha = Like",
        left: "👈 Izquierda = Nope",
        up: "👆 Arriba = Super Like",
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            {phase === "intro" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                    <h1 className="text-2xl font-bold">Así funciona esto 👆</h1>

                    <div className="space-y-4 w-full max-w-xs">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                                <Heart className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-semibold">Desliza a la derecha</p>
                                <p className="text-sm text-muted-foreground">Si te gusta la persona</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                                <X className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold">Desliza a la izquierda</p>
                                <p className="text-sm text-muted-foreground">Si no es lo tuyo, pasa</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                <Star className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-semibold">Desliza pa&apos; arriba</p>
                                <p className="text-sm text-muted-foreground">Super Like — que sepa que te encanta</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm">
                        Si los dos se dan like, ¡empatan! 🎉 Y ahí pueden chatear.
                    </p>

                    <Button
                        onClick={() => setPhase("practice")}
                        size="lg"
                        className="w-full max-w-xs text-lg"
                    >
                        ¡Vamos a probar! 👋
                    </Button>
                </div>
            )}

            {phase === "practice" && (
                <div className="flex flex-col items-center flex-1 gap-4">
                    <div className="text-center">
                        <h2 className="text-lg font-bold">Dale, prueba tú 🤙</h2>
                        <p className="text-sm text-muted-foreground">
                            Arrastra la tarjeta a la derecha, izquierda o arriba
                        </p>
                    </div>

                    {/* Swipe progress */}
                    <div className="flex gap-2">
                        {swipesDone.map((dir, i) => (
                            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {SWIPE_LABELS[dir]}
                            </span>
                        ))}
                    </div>

                    {/* Practice card */}
                    <div className="w-full max-w-[280px] mx-auto">
                        <TutorialCard key={cardKey} onSwipeComplete={handleSwipe} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {3 - swipesDone.length} más y ya
                    </p>
                </div>
            )}

            {phase === "done" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                    <span className="text-7xl">🔥</span>
                    <h1 className="text-2xl font-bold">¡Ya la cogiste!</h1>
                    <p className="text-muted-foreground">
                        Estás listo pa&apos; empatarse. Dale al botón y a buscar tu media naranja 🍊
                    </p>

                    <Button
                        onClick={onComplete}
                        disabled={submitting}
                        size="lg"
                        className="w-full max-w-xs text-lg"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </span>
                        ) : (
                            "¡A empatarse! 🚀"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
