import { test, expect } from "@playwright/test"

test.describe("Login", () => {
  test("should allow a user to log in", async ({ page }) => {
    await page.goto("/login")

    await page.fill('input[name="email"]', "testuser@example.com")
    await page.fill('input[name="password"]', "password123")

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL("/dashboard")
  })
})
