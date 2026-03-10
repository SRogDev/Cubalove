import { test, expect } from "@playwright/test";

test.describe("Profile (sin autenticar)", () => {
    test("redirige a login", async ({ page }) => {
        await page.goto("/profile");
        await page.waitForURL(/\/auth\/login/);
        expect(page.url()).toContain("/auth/login");
    });
});

test.describe("Profile (con sesión)", () => {
    test.skip(
        !process.env.E2E_AUTHENTICATED,
        "Requiere sesión autenticada (E2E_AUTHENTICATED=1)",
    );

    test("carga la página de perfil", async ({ page }) => {
        await page.goto("/profile");
        await expect(page.getByText("Mi Perfil")).toBeVisible();
    });

    test("muestra la grilla de fotos", async ({ page }) => {
        await page.goto("/profile");
        await expect(page.getByText("Fotos")).toBeVisible();
        // 6 slots de fotos
        const photoSlots = page.locator('[aria-label*="foto"], [aria-label*="Foto"]');
        await expect(photoSlots).toHaveCount(6);
    });

    test("abre el editor de bio al hacer click", async ({ page }) => {
        await page.goto("/profile");
        await page.click('[aria-label="Editar bio"]');
        // Debe aparecer el sheet con título "Sobre mí"
        await expect(page.getByRole("heading", { name: "Sobre mí" })).toBeVisible();
    });

    test("abre el editor de trabajo al hacer click", async ({ page }) => {
        await page.goto("/profile");
        await page.click('[aria-label="Editar trabajo o estudio"]');
        await expect(
            page.getByRole("heading", { name: "Trabajo / Estudio" }),
        ).toBeVisible();
    });

    test("abre el editor de intereses al hacer click", async ({ page }) => {
        await page.goto("/profile");
        await page.click('[aria-label="Editar intereses"]');
        await expect(
            page.getByRole("heading", { name: "Intereses" }),
        ).toBeVisible();
        // Debe haber chips de intereses sugeridos
        const chips = page.locator("button").filter({ hasText: /Música|Béisbol|Salsa/i });
        expect(await chips.count()).toBeGreaterThan(0);
    });

    test("abre el editor de prompts al hacer click", async ({ page }) => {
        await page.goto("/profile");
        // Click en el primer slot de prompt
        await page.click('[aria-label*="prompt 1"]');
        await expect(
            page.getByRole("heading", { name: /Prompt 1/i }),
        ).toBeVisible();
    });

    test("el botón de cerrar sesión existe", async ({ page }) => {
        await page.goto("/profile");
        await expect(
            page.getByRole("button", { name: /cerrar sesión/i }),
        ).toBeVisible();
    });

    test("link a Premium existe", async ({ page }) => {
        await page.goto("/profile");
        await expect(
            page.getByRole("link", { name: /mejorar|premium/i }),
        ).toBeVisible();
    });
});
