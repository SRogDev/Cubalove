"use client";

import { useState, useRef, useTransition } from "react";
import { X, Check, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPhoto, deletePhoto } from "@/app/actions/profile";
import type { UserPhoto } from "@/lib/types";

interface PhotoGridEditorProps {
    photos: UserPhoto[];
    onUpdate: () => void;
}

export function PhotoGridEditor({ photos, onUpdate }: PhotoGridEditorProps) {
    const [uploading, setUploading] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingPosition = useRef<number>(1);

    const handleSlotClick = (position: number) => {
        const existingPhoto = photos.find((p) => p.position === position);
        if (existingPhoto) return; // handled by delete button
        pendingPosition.current = position;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const position = pendingPosition.current;
        setUploading(position);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("position", String(position));

        const result = await uploadPhoto(formData);
        setUploading(null);

        if (result.success) {
            onUpdate();
        }

        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    const handleDelete = async (position: number) => {
        setDeleting(position);
        const result = await deletePhoto(position);
        setDeleting(null);
        if (result.success) {
            onUpdate();
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                    const position = i + 1;
                    const photo = photos.find((p) => p.position === position);
                    const isUploading = uploading === position;
                    const isDeleting = deleting === position;

                    return (
                        <div key={position} className="relative group">
                            <button
                                type="button"
                                onClick={() => handleSlotClick(position)}
                                disabled={isUploading || isDeleting}
                                className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                aria-label={photo ? `Foto ${position}` : `Añadir foto ${position}`}
                            >
                                {photo ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={photo.url}
                                        alt={`Foto ${position}`}
                                        className="h-full w-full object-cover"
                                        width={200}
                                        height={300}
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

                            {/* Delete button overlay */}
                            {photo && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(position)}
                                    disabled={isDeleting}
                                    className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                    aria-label={`Eliminar foto ${position}`}
                                >
                                    {isDeleting ? (
                                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={12} />
                                    )}
                                </button>
                            )}

                            {/* Position badge */}
                            {i === 0 && (
                                <span className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                    Principal
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
