import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
    test("redirige a /auth/login si no está autenticado", async ({ page }) => {
        await page.goto("/discover");
        // El proxy.ts redirige a /auth/login si no hay sesión
        await page.waitForURL(/\/auth\/login/);
        expect(page.url()).toContain("/auth/login");
    });

    test("la página de login se carga correctamente", async ({ page }) => {
        await page.goto("/auth/login");
        await expect(page).toHaveTitle(/Empatando/);
        // Debe tener el botón de Google OAuth
        await expect(
            page.getByRole("button", { name: /google/i }),
        ).toBeVisible();
    });

    test("la página de sign-up se carga correctamente", async ({ page }) => {
        await page.goto("/auth/sign-up");
        await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    });
});
