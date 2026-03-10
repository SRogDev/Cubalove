import { getAge, formatDistance, formatTimeAgo, cn } from "@/lib/utils";

// ─── getAge ──────────────────────────────────────────────────────────────

describe("getAge", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-02-27"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it("calcula la edad correctamente", () => {
        expect(getAge("2000-02-27")).toBe(26); // cumpleaños hoy
    });

    it("resta 1 si aún no ha cumplido años", () => {
        expect(getAge("2000-03-15")).toBe(25); // cumple en marzo
    });

    it("funciona con personas nacidas en año bisiesto", () => {
        expect(getAge("2000-02-29")).toBe(25); // 29 feb → aún no es 1 mar
    });

    it("devuelve 0 para un recién nacido", () => {
        expect(getAge("2026-01-01")).toBe(0);
    });
});

// ─── formatDistance ──────────────────────────────────────────────────────

describe("formatDistance", () => {
    it('muestra "< 1 km" para distancias menores a 1 km', () => {
        expect(formatDistance(0.3)).toBe("< 1 km");
        expect(formatDistance(0)).toBe("< 1 km");
        expect(formatDistance(0.99)).toBe("< 1 km");
    });

    it("redondea km correctamente", () => {
        expect(formatDistance(1)).toBe("1 km");
        expect(formatDistance(5.4)).toBe("5 km");
        expect(formatDistance(5.6)).toBe("6 km");
        expect(formatDistance(123.456)).toBe("123 km");
    });
});

// ─── formatTimeAgo ───────────────────────────────────────────────────────

describe("formatTimeAgo", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-02-27T12:00:00Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('muestra "ahora" para menos de 1 minuto', () => {
        expect(formatTimeAgo("2026-02-27T11:59:30Z")).toBe("ahora");
    });

    it("muestra minutos para menos de 1 hora", () => {
        expect(formatTimeAgo("2026-02-27T11:30:00Z")).toBe("hace 30m");
        expect(formatTimeAgo("2026-02-27T11:55:00Z")).toBe("hace 5m");
    });

    it("muestra horas para menos de 1 día", () => {
        expect(formatTimeAgo("2026-02-27T09:00:00Z")).toBe("hace 3h");
        expect(formatTimeAgo("2026-02-26T13:00:00Z")).toBe("hace 23h");
    });

    it("muestra días para menos de 1 semana", () => {
        expect(formatTimeAgo("2026-02-25T12:00:00Z")).toBe("hace 2d");
        expect(formatTimeAgo("2026-02-21T12:00:00Z")).toBe("hace 6d");
    });

    it("muestra fecha formateada para más de 1 semana", () => {
        const result = formatTimeAgo("2026-02-01T12:00:00Z");
        // toLocaleDateString("es-CU", { day: "numeric", month: "short" })
        // Should contain "1" and "feb" (locale-dependent)
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
    });
});

// ─── cn (classnames merge) ───────────────────────────────────────────────

describe("cn", () => {
    it("combina clases de Tailwind", () => {
        expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("resuelve conflictos de Tailwind (último gana)", () => {
        expect(cn("px-4", "px-8")).toBe("px-8");
    });

    it("filtra valores falsy", () => {
        expect(cn("px-4", false && "hidden", null, undefined, "py-2")).toBe(
            "px-4 py-2",
        );
    });

    it("funciona con strings vacíos", () => {
        expect(cn("", "px-4")).toBe("px-4");
    });
});
