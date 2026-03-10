import { test, expect } from "@playwright/test";

test.describe("Matches (sin autenticar)", () => {
    test("redirige a login", async ({ page }) => {
        await page.goto("/matches");
        await page.waitForURL(/\/auth\/login/);
        expect(page.url()).toContain("/auth/login");
    });
});

test.describe("Matches (con sesión)", () => {
    test.skip(
        !process.env.E2E_AUTHENTICATED,
        "Requiere sesión autenticada (E2E_AUTHENTICATED=1)",
    );

    test("carga la página de matches", async ({ page }) => {
        await page.goto("/matches");
        // Debe mostrar lista de matches o estado vacío
        const heading = page.getByText(/matches|tus matches/i);
        const empty = page.getByText(/no tienes matches|empieza a descubrir/i);

        const hasHeading = (await heading.count()) > 0;
        const hasEmpty = (await empty.count()) > 0;

        expect(hasHeading || hasEmpty).toBe(true);
    });
});
