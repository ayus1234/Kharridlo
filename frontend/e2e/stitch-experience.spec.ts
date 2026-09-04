import { test, expect } from "@playwright/test";

test.describe("Kharridlo Stitch AI Buyer & Merchant Experience Verification", () => {
  test("1. Buyer Experience: Home, Assistant, Recommendations, and Product Detail", async ({ page }) => {
    // 1.1 Home page
    await page.goto("/");
    await expect(page.locator("text=Kharridlo").first()).toBeVisible();
    await expect(page.locator("text=AI proposes.").first()).toBeVisible();

    // 1.2 Assistant page
    await page.goto("/assistant");
    await expect(page.locator("h1")).toContainText("Kharridlo AI Shopping Assistant");
    await expect(page.locator("text=Gemini 2.0 Bounded").first()).toBeVisible();
    await expect(page.locator("input[placeholder*='Ask Kharridlo AI']")).toBeVisible();

    // 1.3 Recommendations page
    await page.goto("/recommendations");
    await expect(page.locator("h1")).toContainText("AI Recommended Hardware");
    await expect(page.locator("text=Personalized Intelligence").first()).toBeVisible();

    // 1.4 Product Details page
    await page.goto("/product/prod_laptop_pro_15");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Authorize & Checkout")).toBeVisible();
    await expect(page.locator("text=AI Student Fit Analysis")).toBeVisible();

    // 1.5 Compare page
    await page.goto("/compare");
    await expect(page.locator("h1")).toContainText("Product Comparison Matrix");
    await expect(page.locator("text=Comparison Matrix")).toBeVisible();
  });

  test("2. Buyer Experience: Governance Edge States & Confirmation", async ({ page }) => {
    // 2.1 Checkout Authorize Gate
    await page.goto("/checkout/authorize?amount=₹4,499&category=Electronics");
    await expect(page.locator("h1")).toContainText("Purchase Authorization Gate");
    await expect(page.locator("text=Deterministic governance checkpoint").first()).toBeVisible();
    await expect(page.locator("button:has-text('Grant Authorization')")).toBeVisible();

    // 2.2 Order Confirmed with Verification Drawer
    await page.goto("/order/confirmed?order_id=order_test_998811&amount=₹4,499");
    await expect(page.locator("h1")).toContainText("Order Confirmed & Authorized");
    await expect(page.locator("text=order_test_998811")).toBeVisible();
    await expect(page.locator("button:has-text('View System Verification Proof')")).toBeVisible();
    
    // Toggle system verification drawer
    await page.locator("button:has-text('View System Verification Proof')").click();
    await expect(page.locator("text=Backend Cryptographic Verification")).toBeVisible();

    // 2.3 Product Unavailable Recovery
    await page.goto("/product/unavailable?sku=TECH-OOS-01");
    await expect(page.locator("h1")).toContainText("Product Currently Out of Stock");
    await expect(page.locator("text=Inventory Depleted")).toBeVisible();
    await expect(page.locator("button:has-text('Select Alternative')").first()).toBeVisible();

    // 2.4 Transaction Blocked Policy
    await page.goto("/transaction/blocked?rule=TIER_1_LIMIT_EXCEEDED&amount=₹18,500");
    await expect(page.locator("h1")).toContainText("Transaction Blocked by Policy");
    await expect(page.locator("text=TIER_1_LIMIT_EXCEEDED")).toBeVisible();
    await expect(page.locator("text=Return to Cart to Adjust Items")).toBeVisible();
  });

  test("3. Merchant Experience: Command Center, Analytics & Live Activity", async ({ page }) => {
    // 3.1 Command Center
    await page.goto("/merchant/command-center");
    await expect(page.locator("h1")).toContainText("AI Commerce Command Center");
    await expect(page.locator("text=Active Buyer Radar").first()).toBeVisible();
    await expect(page.locator("text=Mission Control Online").first()).toBeVisible();

    // 3.2 Efficiency Overview
    await page.goto("/merchant/overview");
    await expect(page.locator("h1")).toContainText("AI Commerce Overview");
    await expect(page.locator("text=Agent Queries (24h)")).toBeVisible();

    // 3.3 Commerce Analytics
    await page.goto("/merchant/analytics");
    await expect(page.locator("h1")).toContainText("Commerce Analytics & Insights");
    await expect(page.locator("text=High-Intent Query Clusters")).toBeVisible();

    // 3.4 Live Activity Feed & Simulator
    await page.goto("/merchant/activity");
    await expect(page.locator("h1")).toContainText("Live AI Commerce Activity Feed");
    await expect(page.locator("text=Real-Time Event Stream")).toBeVisible();
    await expect(page.locator("button:has-text('Interactive Event Simulator')")).toBeVisible();
    await page.locator("button:has-text('Interactive Event Simulator')").click();
    await expect(page.locator("text=Telemetry Event Simulator")).toBeVisible();
  });

  test("4. Merchant Experience: Sessions, State Machine, Policies & System Map", async ({ page }) => {
    // 4.1 Active Sessions
    await page.goto("/merchant/sessions");
    await expect(page.locator("h1")).toContainText("Active AI Buyer Sessions");
    await expect(page.locator("text=Student Intent Prompt").first()).toBeVisible();
    await expect(page.locator("text=Inspect Trace").first()).toBeVisible();

    // 4.2 Lifecycle State Machine
    await page.goto("/merchant/lifecycle");
    await expect(page.locator("h1")).toContainText("Live Transaction Lifecycle State Machine");
    await expect(page.locator("text=Phase 2: Deterministic Policy Gate").first()).toBeVisible();

    // 4.3 Policy Center
    await page.goto("/merchant/policies");
    await expect(page.locator("h1")).toContainText("Policy Center & Rule Governance");
    await expect(page.locator("text=Deterministic Rule Engines Active")).toBeVisible();

    // 4.4 Revenue Advisor
    await page.goto("/merchant/revenue-advisor");
    await expect(page.locator("h1")).toContainText("AI Revenue Advisor");
    await expect(page.locator("text=Active Growth & Revenue Opportunities")).toBeVisible();

    // 4.5 Inventory Recovery
    await page.goto("/merchant/recovery");
    await expect(page.locator("h1")).toContainText("AI Inventory Recovery Log");
    await expect(page.locator("text=Stockout Recovery Journal")).toBeVisible();

    // 4.6 System Connectivity Map
    await page.goto("/merchant/system-map");
    await expect(page.locator("h1")).toContainText("System Connectivity Map");
    await expect(page.locator("text=Deterministic Policy Engine")).toBeVisible();
    await expect(page.locator("text=Zero Payment Authority")).toBeVisible();
  });

  test("5. Mobile Viewport Navigation & Responsiveness", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Buyer mobile nav
    await page.goto("/");
    await expect(page.locator("text=Kharridlo").first()).toBeVisible();
    const menuBtn = page.locator("button[aria-label='Toggle Navigation Menu']");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.locator("text=Merchant Portal").first()).toBeVisible();

    // Merchant mobile responsiveness
    await page.goto("/merchant/command-center");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=AI Commerce Command Center")).toBeVisible();
  });

  test("6. Complete Rebrand Verification: Kharridlo branding everywhere, zero DhanKriya in user-facing UI", async ({ page }) => {
    const urlsToInspect = [
      "/",
      "/catalog",
      "/cart",
      "/assistant",
      "/recommendations",
      "/merchant",
      "/merchant/command-center",
      "/merchant/system-map",
      "/order/confirmed"
    ];

    for (const url of urlsToInspect) {
      await page.goto(url);
      const textContent = await page.textContent("body");
      // Must contain Kharridlo
      expect(textContent).toContain("Kharridlo");
      // Must not contain DhanKriya in visible content
      expect(textContent).not.toContain("DhanKriya");
    }
  });

  test("7. Kharridlo Logo Integration Verification across Desktop, Tablet & Mobile", async ({ page }) => {
    // 7.1 Desktop Hero & Navbar
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Hero compact logo (tagline hidden)
    const heroLogo = page.locator("section img[alt='Kharridlo']").first();
    await expect(heroLogo).toBeVisible();

    // Navbar compact logo
    const navbarLogo = page.locator("header img[alt='Kharridlo']").first();
    await expect(navbarLogo).toBeVisible();

    // Footer full logo
    const footerLogo = page.locator("footer img[alt='Kharridlo — From AI intent to trusted transactions.']").first();
    await expect(footerLogo).toBeVisible();

    // 7.2 Mobile Viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("header img[alt='Kharridlo']").first()).toBeVisible();

    // 7.3 Cart Page Logo
    await page.goto("/cart");
    await expect(page.locator("header img[alt='Kharridlo']").first()).toBeVisible();

    // 7.4 Merchant Sidebar Logo (Desktop) & Ayush Nathani Profile
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/merchant");
    const merchantLogo = page.locator("aside img[alt='Kharridlo']").first();
    await expect(merchantLogo).toBeVisible();
    await expect(page.locator("text=Ayush Nathani")).toBeVisible();

    // 7.5 Merchant Mobile Header Logo (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/merchant");
    const mobileMerchantLogo = page.locator("header img[alt='Kharridlo home']").first();
    await expect(mobileMerchantLogo).toBeVisible();
  });
});
