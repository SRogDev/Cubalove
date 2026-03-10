"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/actions/profile";

// ---------------------------------------------------------------------------
// Generic inline-edit sheet (slides up from bottom, mobile-first)
// ---------------------------------------------------------------------------

interface EditSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function EditSheet({ open, onClose, title, children }: EditSheetProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 animate-in fade-in-0"
                onClick={onClose}
            />
            {/* Sheet */}
            <div className="relative w-full max-w-lg rounded-t-3xl bg-background p-6 pb-8 shadow-xl animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Bio Editor
// ---------------------------------------------------------------------------

interface BioEditorProps {
    open: boolean;
    onClose: () => void;
    currentBio: string | null;
    onSaved: () => void;
}

export function BioEditor({ open, onClose, currentBio, onSaved }: BioEditorProps) {
    const [value, setValue] = useState(currentBio ?? "");
    const [isPending, startTransition] = useTransition();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) {
            setValue(currentBio ?? "");
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [open, currentBio]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProfile({ bio: value || null });
            if (result.success) {
                onSaved();
                onClose();
            }
        });
    };

    return (
        <EditSheet open={open} onClose={onClose} title="Sobre mí">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Escribe algo sobre ti..."
                className="w-full rounded-xl bg-muted/50 border border-border/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{value.length}/300</span>
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    size="sm"
                    className="rounded-full gradient-primary text-white gap-1.5"
                >
                    {isPending ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={14} />
                    )}
                    Guardar
                </Button>
            </div>
        </EditSheet>
    );
}

// ---------------------------------------------------------------------------
// Work/Study Editor
// ---------------------------------------------------------------------------

interface WorkEditorProps {
    open: boolean;
    onClose: () => void;
    currentValue: string | null;
    onSaved: () => void;
}

export function WorkEditor({ open, onClose, currentValue, onSaved }: WorkEditorProps) {
    const [value, setValue] = useState(currentValue ?? "");
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setValue(currentValue ?? "");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, currentValue]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProfile({ work_study: value || null });
            if (result.success) {
                onSaved();
                onClose();
            }
        });
    };

    return (
        <EditSheet open={open} onClose={onClose} title="Trabajo / Estudio">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={100}
                placeholder="Ej: CUJAE, Freelancer, Músico..."
                className="w-full rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end mt-3">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    size="sm"
                    className="rounded-full gradient-primary text-white gap-1.5"
                >
                    {isPending ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={14} />
                    )}
                    Guardar
                </Button>
            </div>
        </EditSheet>
    );
}

// ---------------------------------------------------------------------------
// Prompt Editor
// ---------------------------------------------------------------------------

interface PromptEditorProps {
    open: boolean;
    onClose: () => void;
    position: number;
    currentPromptText: string;
    currentAnswerText: string;
    suggestedPrompts: string[];
    onSaved: () => void;
}

export function PromptEditor({
    open,
    onClose,
    position,
    currentPromptText,
    currentAnswerText,
    suggestedPrompts,
    onSaved,
}: PromptEditorProps) {
    const [promptText, setPromptText] = useState(currentPromptText);
    const [answerText, setAnswerText] = useState(currentAnswerText);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open) {
            setPromptText(currentPromptText);
            setAnswerText(currentAnswerText);
        }
    }, [open, currentPromptText, currentAnswerText]);

    const handleSave = () => {
        if (!promptText.trim() || !answerText.trim()) return;
        startTransition(async () => {
            const { upsertPrompt } = await import("@/app/actions/profile");
            const result = await upsertPrompt({
                position,
                prompt_text: promptText.trim(),
                answer_text: answerText.trim(),
            });
            if (result.success) {
                onSaved();
                onClose();
            }
        });
    };

    return (
        <EditSheet open={open} onClose={onClose} title={`Prompt ${position}`}>
            {/* Prompt selector */}
            <div className="mb-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Pregunta
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto">
                    {suggestedPrompts.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPromptText(p)}
                            className={`text-xs rounded-full px-2.5 py-1 transition-colors ${promptText === p
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    maxLength={200}
                    placeholder="O escribe tu propia pregunta..."
                    className="w-full rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Answer input */}
            <div className="mb-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Tu respuesta
                </label>
                <input
                    type="text"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    maxLength={100}
                    placeholder="Tu respuesta..."
                    className="w-full rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground mt-1 block text-right">
                    {answerText.length}/100
                </span>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isPending || !promptText.trim() || !answerText.trim()}
                    size="sm"
                    className="rounded-full gradient-primary text-white gap-1.5"
                >
                    {isPending ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={14} />
                    )}
                    Guardar
                </Button>
            </div>
        </EditSheet>
    );
}

// ---------------------------------------------------------------------------
// Interests Editor
// ---------------------------------------------------------------------------

interface InterestsEditorProps {
    open: boolean;
    onClose: () => void;
    currentInterests: string[];
    suggestedInterests: string[];
    onSaved: () => void;
}

export function InterestsEditor({
    open,
    onClose,
    currentInterests,
    suggestedInterests,
    onSaved,
}: InterestsEditorProps) {
    const [selected, setSelected] = useState<string[]>(currentInterests);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open) setSelected(currentInterests);
    }, [open, currentInterests]);

    const toggle = (interest: string) => {
        setSelected((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : prev.length < 10
                    ? [...prev, interest]
                    : prev,
        );
    };

    const handleSave = () => {
        startTransition(async () => {
            const { updateInterests } = await import("@/app/actions/profile");
            const result = await updateInterests({ interests: selected });
            if (result.success) {
                onSaved();
                onClose();
            }
        });
    };

    return (
        <EditSheet open={open} onClose={onClose} title="Intereses">
            <p className="text-xs text-muted-foreground mb-3">
                Selecciona hasta 10 intereses ({selected.length}/10)
            </p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto mb-4">
                {suggestedInterests.map((interest) => {
                    const isSelected = selected.includes(interest);
                    return (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => toggle(interest)}
                            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${isSelected
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {interest}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    size="sm"
                    className="rounded-full gradient-primary text-white gap-1.5"
                >
                    {isPending ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={14} />
                    )}
                    Guardar
                </Button>
            </div>
        </EditSheet>
    );
}
