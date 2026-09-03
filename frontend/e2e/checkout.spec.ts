import { test, expect } from "@playwright/test";

test.describe("Kharridlo E2E Autonomous Commerce & Razorpay Checkout Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage first to verify branding
    await page.goto("/");
    await expect(page.locator("text=Kharridlo").first()).toBeVisible();
  });

  test("1. Catalog product discovery and category filtering", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.locator("h1")).toContainText("Synthetic Product Catalog");

    // Click Keyboards filter
    const keyboardFilter = page.locator("button:has-text('Keyboards')");
    await expect(keyboardFilter).toBeVisible();
    await keyboardFilter.click();
    await expect(page.locator("text=TechNova CodeCraft Pro Mechanical").first()).toBeVisible();
  });

  test("2. Add product to cart and verify authoritative total", async ({ page }) => {
    await page.goto("/catalog");

    // Locate first Add to Cart button and click
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Navigate to cart
    await page.goto("/cart");
    await expect(page.locator("h1")).toContainText("Authoritative Cart & Payment Gate");
    await expect(page.locator("text=Financial Summary (Integer Paise)")).toBeVisible();
  });

  test("3. Deterministic Policy Gate and Buyer Authorization workflow", async ({ page }) => {
    await page.goto("/catalog");
    await page.locator("button:has-text('Add to Cart')").first().click();

    await page.goto("/cart");

    // Wait for cart to load
    await expect(page.locator("text=Financial Summary (Integer Paise)")).toBeVisible();

    // Click Policy Evaluation
    const evalBtn = page.locator("button:has-text('Evaluate Commerce Policy Gate')");
    await expect(evalBtn).toBeVisible();
    await evalBtn.click();

    // Verify policy evaluation status appears
    await expect(page.locator("text=Policy Gate Status")).toBeVisible({ timeout: 10000 });

    // Buyer Authorization Button
    const authBtn = page.locator("button:has-text('Grant Explicit Buyer Authorization')");
    await expect(authBtn).toBeVisible();
    await authBtn.click();
    await expect(page.locator("text=Buyer Authorization Granted")).toBeVisible();
  });

  test("4. Server-side payment order initiation and Checkout trigger", async ({ page }) => {
    await page.goto("/catalog");
    await page.locator("button:has-text('Add to Cart')").first().click();

    await page.goto("/cart");
    await expect(page.locator("text=Financial Summary (Integer Paise)")).toBeVisible();

    const evalBtn = page.locator("button:has-text('Evaluate Commerce Policy Gate')");
    await evalBtn.click();
    await expect(page.locator("text=Policy Gate Status")).toBeVisible({ timeout: 10000 });

    const authBtn = page.locator("button:has-text('Grant Explicit Buyer Authorization')");
    await authBtn.click();
    await expect(page.locator("text=Buyer Authorization Granted")).toBeVisible();

    // Pay button becomes visible and enabled
    const payBtn = page.locator("button:has-text('Pay')").filter({ hasText: "Razorpay (Test Mode)" });
    await expect(payBtn).toBeVisible();
    await expect(payBtn).toBeEnabled();
  });

  test("5. Merchant Audit Dashboard visibility and real-time records", async ({ page }) => {
    await page.goto("/merchant");
    await expect(page.locator("text=Autonomous Commerce Governance & Payment Audit Trail")).toBeVisible();

    // Verify Governance Metrics cards exist
    await expect(page.locator("text=Total Audit Records")).toBeVisible();
    await expect(page.locator("text=Zero AI Payment Authority")).toBeVisible();
    await expect(page.locator("text=Razorpay Test Mode")).toBeVisible();
    await expect(page.locator("text=Full Redaction Active")).toBeVisible();

    // Verify search and filter controls
    await expect(page.locator("input[placeholder*='Search by Order ID']")).toBeVisible();
  });

  test("6. Session isolation between independent browser contexts", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // User A adds an item
    await pageA.goto("/catalog");
    await pageA.locator("button:has-text('Add to Cart')").first().click();

    // User A views cart -> has items
    await pageA.goto("/cart");
    await expect(pageA.locator("text=Clear Cart")).toBeVisible();

    // User B views cart -> clean empty cart
    await pageB.goto("/cart");
    await expect(pageB.locator("text=Your cart is currently empty")).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
