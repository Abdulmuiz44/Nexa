import { test, expect } from "@playwright/test"

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard")
  })

  test("should display dashboard title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Nexa AI Growth Agent")
  })

  test("should show campaign metrics", async ({ page }) => {
    await expect(page.locator('[data-testid="active-campaigns"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-generated"]')).toBeVisible()
    await expect(page.locator('[data-testid="engagement-rate"]')).toBeVisible()
    await expect(page.locator('[data-testid="reach"]')).toBeVisible()
  })

  test("should navigate between tabs", async ({ page }) => {
    await page.click('[data-value="analytics"]')
    await expect(page.locator("text=Performance Analytics")).toBeVisible()

    await page.click('[data-value="content"]')
    await expect(page.locator("text=Generated Content")).toBeVisible()

    await page.click('[data-value="settings"]')
    await expect(page.locator("text=Agent Configuration")).toBeVisible()
  })

  test("should allow creating new campaign", async ({ page }) => {
    await page.click("text=New Campaign")
    // Add assertions for campaign creation flow
  })
})
