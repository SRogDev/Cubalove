import {
    createSwipeSchema,
    updateProfileSchema,
    updateInterestsSchema,
    updatePromptSchema,
    createReportSchema,
    checkoutSchema,
    coupleRequestSchema,
    diaryEntrySchema,
} from "@/lib/schemas";

// ─── createSwipeSchema ───────────────────────────────────────────────────

describe("createSwipeSchema", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("acepta un swipe válido", () => {
        const result = createSwipeSchema.safeParse({
            targetId: validUUID,
            type: "like",
        });
        expect(result.success).toBe(true);
    });

    it.each(["like", "nope", "superlike"])('acepta tipo "%s"', (type) => {
        const result = createSwipeSchema.safeParse({ targetId: validUUID, type });
        expect(result.success).toBe(true);
    });

    it("rechaza un tipo inválido", () => {
        const result = createSwipeSchema.safeParse({
            targetId: validUUID,
            type: "megaLike",
        });
        expect(result.success).toBe(false);
    });

    it("rechaza un UUID inválido", () => {
        const result = createSwipeSchema.safeParse({
            targetId: "no-es-uuid",
            type: "like",
        });
        expect(result.success).toBe(false);
    });

    it("rechaza datos vacíos", () => {
        const result = createSwipeSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

// ─── updateProfileSchema ─────────────────────────────────────────────────

describe("updateProfileSchema", () => {
    it("acepta un perfil parcial válido", () => {
        const result = updateProfileSchema.safeParse({
            display_name: "Carlos",
            bio: "Hola mundo",
        });
        expect(result.success).toBe(true);
    });

    it("acepta un objeto vacío (todo es opcional)", () => {
        const result = updateProfileSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it("rechaza display_name demasiado corto", () => {
        const result = updateProfileSchema.safeParse({ display_name: "A" });
        expect(result.success).toBe(false);
    });

    it("rechaza bio demasiado larga (> 300)", () => {
        const result = updateProfileSchema.safeParse({ bio: "x".repeat(301) });
        expect(result.success).toBe(false);
    });

    it("acepta bio null (borrar bio)", () => {
        const result = updateProfileSchema.safeParse({ bio: null });
        expect(result.success).toBe(true);
    });

    it("acepta géneros válidos", () => {
        for (const gender of ["hombre", "mujer", "otro"]) {
            const result = updateProfileSchema.safeParse({ gender });
            expect(result.success).toBe(true);
        }
    });

    it("rechaza género inválido", () => {
        const result = updateProfileSchema.safeParse({ gender: "alien" });
        expect(result.success).toBe(false);
    });

    it("acepta show_me válidos", () => {
        for (const show_me of ["hombres", "mujeres", "ambos"]) {
            const result = updateProfileSchema.safeParse({ show_me });
            expect(result.success).toBe(true);
        }
    });
});

// ─── updateInterestsSchema ───────────────────────────────────────────────

describe("updateInterestsSchema", () => {
    it("acepta un array de intereses válido", () => {
        const result = updateInterestsSchema.safeParse({
            interests: ["Música", "Béisbol", "Salsa"],
        });
        expect(result.success).toBe(true);
    });

    it("acepta array vacío", () => {
        const result = updateInterestsSchema.safeParse({ interests: [] });
        expect(result.success).toBe(true);
    });

    it("rechaza más de 10 intereses", () => {
        const result = updateInterestsSchema.safeParse({
            interests: Array.from({ length: 11 }, (_, i) => `Interés ${i}`),
        });
        expect(result.success).toBe(false);
    });

    it("rechaza intereses con string vacío", () => {
        const result = updateInterestsSchema.safeParse({ interests: [""] });
        expect(result.success).toBe(false);
    });
});

// ─── updatePromptSchema ──────────────────────────────────────────────────

describe("updatePromptSchema", () => {
    it("acepta un prompt válido", () => {
        const result = updatePromptSchema.safeParse({
            position: 1,
            prompt_text: "¿Cuál es tu plato favorito?",
            answer_text: "Arroz con pollo",
        });
        expect(result.success).toBe(true);
    });

    it("rechaza position fuera de rango (0, 4)", () => {
        expect(
            updatePromptSchema.safeParse({
                position: 0,
                prompt_text: "test",
                answer_text: "test",
            }).success,
        ).toBe(false);
        expect(
            updatePromptSchema.safeParse({
                position: 4,
                prompt_text: "test",
                answer_text: "test",
            }).success,
        ).toBe(false);
    });

    it("rechaza prompt_text vacío", () => {
        const result = updatePromptSchema.safeParse({
            position: 1,
            prompt_text: "",
            answer_text: "Algo",
        });
        expect(result.success).toBe(false);
    });

    it("rechaza answer_text > 100 chars", () => {
        const result = updatePromptSchema.safeParse({
            position: 1,
            prompt_text: "Pregunta",
            answer_text: "x".repeat(101),
        });
        expect(result.success).toBe(false);
    });
});

// ─── createReportSchema ──────────────────────────────────────────────────

describe("createReportSchema", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("acepta un reporte válido sin detalles", () => {
        const result = createReportSchema.safeParse({
            targetUserId: validUUID,
            reason: "fake",
        });
        expect(result.success).toBe(true);
    });

    it("acepta un reporte con detalles", () => {
        const result = createReportSchema.safeParse({
            targetUserId: validUUID,
            reason: "spam",
            details: "Enviando publicidad",
        });
        expect(result.success).toBe(true);
    });

    it('requiere detalles si reason es "other"', () => {
        const result = createReportSchema.safeParse({
            targetUserId: validUUID,
            reason: "other",
        });
        expect(result.success).toBe(false);
    });

    it('acepta "other" con detalles', () => {
        const result = createReportSchema.safeParse({
            targetUserId: validUUID,
            reason: "other",
            details: "Contenido ofensivo en bio",
        });
        expect(result.success).toBe(true);
    });

    it.each(["fake", "inappropriate", "harassment", "minor", "spam", "other"])(
        'acepta reason "%s"',
        (reason) => {
            const result = createReportSchema.safeParse({
                targetUserId: validUUID,
                reason,
                details: reason === "other" ? "Motivo personalizado" : undefined,
            });
            expect(result.success).toBe(true);
        },
    );
});

// ─── checkoutSchema ──────────────────────────────────────────────────────

describe("checkoutSchema", () => {
    it('acepta plan "plus"', () => {
        expect(checkoutSchema.safeParse({ plan: "plus" }).success).toBe(true);
    });

    it('acepta plan "vip"', () => {
        expect(checkoutSchema.safeParse({ plan: "vip" }).success).toBe(true);
    });

    it("rechaza plan desconocido", () => {
        expect(checkoutSchema.safeParse({ plan: "gold" }).success).toBe(false);
    });
});

// ─── coupleRequestSchema ─────────────────────────────────────────────────

describe("coupleRequestSchema", () => {
    it("acepta solicitud válida", () => {
        const result = coupleRequestSchema.safeParse({
            phone: "+5358001234",
            name: "María",
        });
        expect(result.success).toBe(true);
    });

    it("rechaza teléfono muy corto", () => {
        const result = coupleRequestSchema.safeParse({
            phone: "123",
            name: "María",
        });
        expect(result.success).toBe(false);
    });

    it("rechaza nombre muy corto", () => {
        const result = coupleRequestSchema.safeParse({
            phone: "+5358001234",
            name: "A",
        });
        expect(result.success).toBe(false);
    });
});

// ─── diaryEntrySchema ────────────────────────────────────────────────────

describe("diaryEntrySchema", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("acepta entrada válida", () => {
        const result = diaryEntrySchema.safeParse({
            roomId: validUUID,
            content: "Hoy fue un gran día ❤️",
        });
        expect(result.success).toBe(true);
    });

    it("rechaza contenido vacío", () => {
        const result = diaryEntrySchema.safeParse({
            roomId: validUUID,
            content: "",
        });
        expect(result.success).toBe(false);
    });

    it("rechaza contenido > 500 chars", () => {
        const result = diaryEntrySchema.safeParse({
            roomId: validUUID,
            content: "x".repeat(501),
        });
        expect(result.success).toBe(false);
    });

    it("rechaza roomId inválido", () => {
        const result = diaryEntrySchema.safeParse({
            roomId: "no-uuid",
            content: "Hola",
        });
        expect(result.success).toBe(false);
    });
});
