import { test, expect } from "@playwright/test";

// Estas pruebas requieren un usuario autenticado.
// En CI se usaría storageState (cookies guardadas) o un helper de login programático.
// Por ahora validamos que las páginas protegidas redirigen correctamente sin sesión.

test.describe("Discover (sin autenticar)", () => {
    test("redirige a login", async ({ page }) => {
        await page.goto("/discover");
        await page.waitForURL(/\/auth\/login/);
        expect(page.url()).toContain("/auth/login");
    });
});

test.describe("Discover (estructura de la UI)", () => {
    // Este test carga la página de discover directamente asumiendo que
    // en desarrollo hay una sesión activa en el navegador.
    // Si falla por redirect, es esperado en CI sin auth.

    test.skip(
        !process.env.E2E_AUTHENTICATED,
        "Requiere sesión autenticada (E2E_AUTHENTICATED=1)",
    );

    test("muestra la barra de navegación inferior", async ({ page }) => {
        await page.goto("/discover");
        // Bottom nav con iconos de discover, matches, profile
        const nav = page.locator("nav");
        await expect(nav).toBeVisible();
    });

    test("muestra tarjetas de swipe o estado vacío", async ({ page }) => {
        await page.goto("/discover");
        // O hay tarjetas o hay mensaje de "no hay más perfiles"
        const card = page.locator('[aria-label*="perfil"], [data-testid="swipe-card"]');
        const empty = page.getByText(/no hay más perfiles|no encontramos/i);
        const loading = page.locator('[class*="animate-spin"]');

        // Esperar a que cargue
        await expect(loading).toHaveCount(0, { timeout: 10_000 });

        const hasCard = (await card.count()) > 0;
        const hasEmpty = (await empty.count()) > 0;

        expect(hasCard || hasEmpty).toBe(true);
    });
});
