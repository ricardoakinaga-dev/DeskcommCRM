// Execute com o app de teste na porta 56301 e .env.e2e local:
// pnpm exec tsx --env-file=.env.e2e evidence/custom-upstream-20261116/validate-ui.mjs
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { loginComoDono } from "../../tests/e2e/helpers/login-admin.ts";
const root = process.cwd();
const req = createRequire(root + "/package.json");
const { chromium, expect } = req("@playwright/test");
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: "http://localhost:56301",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const creds = JSON.parse(readFileSync(root + "/.e2e-creds.json", "utf8"));
  const evidence = root + "/evidence/custom-upstream-20261116";
  mkdirSync(evidence, { recursive: true });
  const results = [];
  let original, originalDark;
  try {
    await loginComoDono(page, creds);
    await page.goto("/admin/marca");
    await expect(page.locator("#custom_css")).toBeVisible({ timeout: 30000 });
    original = await page.locator("#custom_css").inputValue();
    originalDark = await page.locator("#custom_css_escuro").inputValue();
    await page
      .locator("#custom_css")
      .fill(readFileSync(root + "/personalizacoes/cevet-guarapiranga/tema.css", "utf8"));
    await page
      .locator("#custom_css_escuro")
      .fill(".text-muted-foreground { color: rgb(241, 242, 243); }");
    await page.getByRole("button", { name: "Salvar CSS", exact: true }).click();
    await expect(page.getByText("CSS personalizado salvo.")).toBeVisible({ timeout: 15000 });
    for (const width of [1280, 390])
      for (const theme of ["light", "dark"]) {
        const visitor = await browser.newContext({
          baseURL: "http://localhost:56301",
          viewport: { width, height: 900 },
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        try {
          await visitor.addInitScript((t) => localStorage.setItem("deskcomm-theme", t), theme);
          const login = await visitor.newPage();
          await login.goto("/login");
          await expect(login.locator("html")).toHaveAttribute("data-theme", theme);
          await expect(login.locator("#email")).toBeVisible();
          const expected = theme === "light" ? "#f5f8fb" : "#0b1e30";
          await expect
            .poll(() =>
              login
                .locator("body")
                .evaluate((e) =>
                  getComputedStyle(e).getPropertyValue("--color-bg").trim().toLowerCase(),
                ),
            )
            .toBe(expected);
          const font = await login.locator("body").evaluate((e) => getComputedStyle(e).fontFamily);
          expect(font.toLowerCase()).toContain("outfit");
          const muted = login.locator(".text-muted-foreground").first();
          if (theme === "dark")
            await expect
              .poll(() => muted.evaluate((e) => getComputedStyle(e).color))
              .toBe("rgb(241, 242, 243)");
          else
            expect(await muted.evaluate((e) => getComputedStyle(e).color)).not.toBe(
              "rgb(241, 242, 243)",
            );
          await login.evaluate(() => document.fonts.ready);
          const overflow = await login.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          expect(overflow).toBe(false);
          await login.screenshot({
            path: `${evidence}/login-${theme}-${width}.png`,
            fullPage: true,
          });
          results.push({
            width,
            theme,
            backgroundToken: expected,
            font,
            darkFieldScoped: true,
            overflow,
          });
        } finally {
          await visitor.close();
        }
      }
    writeFileSync(
      evidence + "/validation.json",
      JSON.stringify(
        {
          observedAt: new Date().toISOString(),
          main: "b193a682353d0f8ddefb7e34e64f29870dd7d7b5",
          database: "fresh local baseline.sql",
          checks: results,
        },
        null,
        2,
      ) + "\n",
    );
    console.info(JSON.stringify({ passed: results.length, checks: results }));
  } finally {
    if (original !== undefined) {
      await page.goto("/admin/marca");
      await page.locator("#custom_css").fill(original);
      await page.locator("#custom_css_escuro").fill(originalDark ?? "");
      await page.getByRole("button", { name: "Salvar CSS", exact: true }).click();
      await expect(page.getByText("CSS personalizado salvo.")).toBeVisible({ timeout: 15000 });
    }
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
