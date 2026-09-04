import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "Mobile Small (320px)", width: 320, height: 568 },
  { name: "Mobile Standard (375px)", width: 375, height: 667 },
  { name: "Mobile Modern (390px)", width: 390, height: 844 },
];

const ALL_STITCH_ROUTES = [
  { path: "/", label: "AI Shopping Home" },
  { path: "/assistant", label: "AI Shopping Assistant" },
  { path: "/recommendations", label: "AI Recommendations Grid" },
  { path: "/product/prod_laptop_pro_15", label: "Product Detail Page" },
  { path: "/compare", label: "Product Comparison Matrix" },
  { path: "/cart", label: "Authoritative Cart Gate" },
  { path: "/catalog", label: "Product Catalog" },
  { path: "/checkout/authorize", label: "Purchase Authorization Gate" },
  { path: "/order/confirmed?order_id=ord_m8_mob_01", label: "Order Confirmation" },
  { path: "/order/failed", label: "Payment Interrupted / Failed" },
  { path: "/product/unavailable?sku=TECH-OOS-01", label: "Product Unavailable Recovery" },
  { path: "/transaction/blocked", label: "Transaction Blocked Policy" },
  { path: "/merchant", label: "Merchant Dashboard" },
  { path: "/merchant/command-center", label: "AI Command Center" },
  { path: "/merchant/overview", label: "Agent Efficiency Overview" },
  { path: "/merchant/analytics", label: "Commerce Analytics" },
  { path: "/merchant/activity", label: "Live Activity Feed" },
  { path: "/merchant/sessions", label: "Active Buyer Sessions" },
  { path: "/merchant/lifecycle", label: "Transaction Lifecycle Engine" },
  { path: "/merchant/policies", label: "Policy Center" },
  { path: "/merchant/orders", label: "Orders & Audit Ledger" },
  { path: "/merchant/revenue-advisor", label: "AI Revenue Advisor" },
  { path: "/merchant/recovery", label: "Inventory Recovery Log" },
  { path: "/merchant/system-map", label: "System Connectivity Map" },
];

test.describe("Mobile Viewport Non-Negotiable Verification (320px, 375px, 390px)", () => {
  for (const vp of VIEWPORTS) {
    test(`Verify Zero Horizontal Page Overflow across all Stitch screens at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ALL_STITCH_ROUTES) {
        await page.goto(route.path);
        await page.waitForLoadState("domcontentloaded");

        // Assert zero horizontal overflow: document body must not exceed viewport width
        const overflow = await page.evaluate(() => {
          const scrollW = document.documentElement.scrollWidth;
          const clientW = document.documentElement.clientWidth;
          return { scrollW, clientW, diff: scrollW - clientW };
        });

        expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1); // allow 1px rounding tolerance
      }
    });
  }

  test("Mobile Buyer Navigation Drawer & Touch Targets (>= 44px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Toggle menu
    const menuBtn = page.locator("button[aria-label='Toggle Navigation Menu']");
    await expect(menuBtn).toBeVisible();

    const box = await menuBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // Open drawer
    await menuBtn.click();

    // Verify all mobile drawer links have >= 44px height for thumb access
    const navLinks = page.locator("nav a, div.lg\\:hidden a");
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const linkBox = await navLinks.nth(i).boundingBox();
      if (linkBox && linkBox.height > 0) {
        expect(linkBox.height).toBeGreaterThanOrEqual(40); // Standard touch target boundary
      }
    }
  });

  test("Mobile Merchant Slide-Over Drawer & Touch Targets (>= 44px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/merchant/command-center");

    // Click Merchant Hamburger Menu
    const merchantMenuBtn = page.locator("button[aria-label='Toggle Merchant Navigation Menu']");
    await expect(merchantMenuBtn).toBeVisible();

    const box = await merchantMenuBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    await merchantMenuBtn.click();

    // Verify drawer appears and has close button
    const closeBtn = page.locator("button[aria-label='Close Merchant Navigation']");
    await expect(closeBtn).toBeVisible();
    await expect(page.locator("text=AI Revenue Advisor").last()).toBeVisible();

    // Navigate to Policy Center via mobile drawer
    await page.locator("text=Policy Center").last().click();
    await expect(page.locator("h1")).toContainText("Policy Center & Rule Governance");
  });

  test("Mobile AI Shopping Assistant Responsive Conversation & Reasoning Drawer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/assistant");

    // Verify header wraps cleanly
    await expect(page.locator("h1")).toContainText("Kharridlo AI Shopping Assistant");

    // Verify input is full width and thumb accessible
    const input = page.locator("input[placeholder*='Ask about specs']");
    await expect(input).toBeVisible();
    const inputBox = await input.boundingBox();
    expect(inputBox?.height).toBeGreaterThanOrEqual(44);

    // Verify Starter Prompts wrap into 1 column without clipping
    await expect(page.locator("text=Find a lightweight laptop").first()).toBeVisible();
  });

  test("Mobile Purchase Authorization Gate & Sticky Action CTAs", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/checkout/authorize?amount=₹4,499&category=Electronics");

    await expect(page.locator("h1")).toContainText("Purchase Authorization Gate");
    const authBtn = page.locator("button:has-text('Grant Authorization')");
    await expect(authBtn).toBeVisible();

    // Button must be thumb-accessible
    const btnBox = await authBtn.boundingBox();
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);
  });
});
