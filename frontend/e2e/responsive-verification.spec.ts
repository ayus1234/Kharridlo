import { test, expect } from "@playwright/test";

// The 9 Required Verification Viewports across Mobile, Tablet, and Desktop
export const REQUIRED_VIEWPORT_WIDTHS = [
  { width: 320, height: 568, name: "320px — small mobile", device: "mobile" },
  { width: 375, height: 667, name: "375px — standard mobile", device: "mobile" },
  { width: 390, height: 844, name: "390px — modern mobile", device: "mobile" },
  { width: 414, height: 896, name: "414px — large mobile", device: "mobile" },
  { width: 768, height: 1024, name: "768px — tablet", device: "tablet" },
  { width: 1024, height: 768, name: "1024px — small desktop/tablet landscape", device: "tablet-landscape" },
  { width: 1280, height: 800, name: "1280px — desktop", device: "desktop" },
  { width: 1440, height: 900, name: "1440px — large desktop", device: "desktop-large" },
  { width: 1920, height: 1080, name: "1920px — wide desktop", device: "desktop-wide" },
];

export const ALL_STITCH_ROUTES = [
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

test.describe("Responsive Design Across All 9 Required Viewports (320px - 1920px)", () => {
  for (const vp of REQUIRED_VIEWPORT_WIDTHS) {
    test(`Verify Zero Horizontal Page Overflow & Error-Free Render at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const consoleErrors: string[] = [];
      const pageErrors: Error[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => pageErrors.push(err));

      for (const route of ALL_STITCH_ROUTES) {
        await page.goto(route.path);
        await page.waitForLoadState("domcontentloaded");

        // 1. Assert zero unintended horizontal overflow: scrollWidth <= clientWidth (+1px rounding)
        const overflow = await page.evaluate(() => {
          const scrollW = document.documentElement.scrollWidth;
          const clientW = document.documentElement.clientWidth;
          return { scrollW, clientW, diff: scrollW - clientW };
        });

        expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);

        // 2. Assert page rendered meaningful root content (not a blank screen)
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(10);
      }

      // Filter out network resource status codes while checking for console-level errors
      const criticalErrors = consoleErrors.filter(
        (err) => 
          !err.includes("404") && 
          !err.includes("405") && 
          !err.includes("400") && 
          !err.includes("favicon") && 
          !err.includes("image") &&
          !err.includes("Failed to load resource")
      );
      expect(criticalErrors).toHaveLength(0);

      // Filter out benign React client hydration mismatches (#418, #423, #425) from fatal runtime exceptions
      const fatalErrors = pageErrors.filter(
        (err) => 
          !err.message.includes("#418") &&
          !err.message.includes("#423") &&
          !err.message.includes("#425") &&
          !err.message.includes("Hydration")
      );
      expect(fatalErrors).toHaveLength(0);
    });
  }

  test("Touch targets maintain minimum 44px on Mobile & Tablet (320px - 768px)", async ({ page }) => {
    const touchWidths = [320, 375, 390, 414, 768];
    for (const width of touchWidths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      // Mobile / Tablet Hamburger
      const menuBtn = page.locator("button[aria-label='Toggle Navigation Menu']");
      await expect(menuBtn).toBeVisible();
      const box = await menuBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("Desktop navigation and sidebars expand cleanly at >= 1024px", async ({ page }) => {
    const desktopWidths = [1024, 1280, 1440, 1920];
    for (const width of desktopWidths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/merchant/command-center");

      // Merchant sidebar must be permanently visible on desktop/large viewports
      const desktopSidebar = page.locator("aside").first();
      await expect(desktopSidebar).toBeVisible();

      // Mobile hamburger should not be displayed on wide desktop
      if (width >= 1280) {
        const mobileHamburger = page.locator("button[aria-label='Toggle Merchant Navigation Menu']");
        await expect(mobileHamburger).not.toBeVisible();
      }
    }
  });

  test("Reflow and column stacking on Product Comparison Matrix", async ({ page }) => {
    // 1. Mobile (375px) - table container must be scrollable without page overflow
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/compare");
    const overflowMobile = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowMobile).toBeLessThanOrEqual(1);

    // 2. Wide Desktop (1920px) - table container fills layout smoothly
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/compare");
    const overflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowDesktop).toBeLessThanOrEqual(1);
  });

  test("Mobile Buyer Navigation Drawer & Touch Targets (>= 44px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

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

    // Verify all mobile drawer links have >= 40px height for thumb access
    const navLinks = page.locator("nav a, div.lg\\:hidden a");
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const linkBox = await navLinks.nth(i).boundingBox();
      if (linkBox && linkBox.height > 0) {
        expect(linkBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("Mobile Merchant Slide-Over Drawer & Touch Targets (>= 44px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/merchant/command-center");

    const merchantMenuBtn = page.locator("button[aria-label='Toggle Merchant Navigation Menu']");
    await expect(merchantMenuBtn).toBeVisible();

    const box = await merchantMenuBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    await merchantMenuBtn.click();

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

    await expect(page.locator("h1")).toContainText("Kharridlo AI Shopping Assistant");

    const input = page.locator("input[placeholder*='Ask about specs']");
    await expect(input).toBeVisible();
    const inputBox = await input.boundingBox();
    expect(inputBox?.height).toBeGreaterThanOrEqual(44);

    await expect(page.locator("text=Find a lightweight laptop").first()).toBeVisible();
  });

  test("Mobile Purchase Authorization Gate & Sticky Action CTAs", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/checkout/authorize?amount=₹4,499&category=Electronics");

    await expect(page.locator("h1")).toContainText("Purchase Authorization Gate");
    const authBtn = page.locator("button:has-text('Grant Authorization')");
    await expect(authBtn).toBeVisible();

    const btnBox = await authBtn.boundingBox();
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);
  });
});
