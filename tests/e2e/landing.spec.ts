import { test, expect } from "../../playwright-fixture";
import { TEST_ORGANIZER, TEST_SPONSOR, type TestUser } from "./test-users";

test.describe("Landing page", () => {
  test("loads landing and navigates to auth", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Conecta eventos con sponsors/i })
    ).toBeVisible();

    await page
      .getByRole("link", { name: /empezar|crear cuenta|registrarse/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { name: /crea tu cuenta|bienvenido/i })
    ).toBeVisible();
  });

  test("protected route redirects unauthenticated user to auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
  });
});

async function login(page: import("@playwright/test").Page, user: TestUser) {
  await page.goto("/auth");

  // Asegúrate de estar en modo "iniciar sesión"
  const toggle = page.getByRole("button", {
    name: /ya tienes cuenta\? inicia sesión/i,
  });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }

  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  // Tras login, RequireProfile lleva al dashboard (los usuarios seed ya tienen perfil)
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Autenticación con cuentas seed", () => {
  test("organizador puede iniciar sesión y acceder al dashboard", async ({ page }) => {
    await login(page, TEST_ORGANIZER);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sponsor puede iniciar sesión y acceder al dashboard", async ({ page }) => {
    await login(page, TEST_SPONSOR);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sponsor puede navegar a la sección de mensajes", async ({ page }) => {
    await login(page, TEST_SPONSOR);
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/messages/);
  });
});
