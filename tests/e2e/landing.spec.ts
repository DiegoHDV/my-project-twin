import { test, expect } from "../../playwright-fixture";

test.describe("Landing page", () => {
  test("loads landing and navigates to auth", async ({ page }) => {
    await page.goto("/");

    // Hero copy is visible
    await expect(
      page.getByRole("heading", { name: /Conecta eventos con sponsors/i })
    ).toBeVisible();

    // Navigate to auth (signup) via one of the CTAs
    await page.getByRole("link", { name: /empezar|crear cuenta|registrarse/i }).first().click();

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
