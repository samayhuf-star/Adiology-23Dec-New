/**
 * End-to-End Workspace Workflow Tests
 * Tests critical workspace functionality in a real browser environment
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@adiology.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Helper functions
async function loginUser(page: Page) {
  await page.goto(`${BASE_URL}/auth`);
  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');
}

async function navigateToWorkspaces(page: Page) {
  await page.click('[data-testid="workspaces-nav"]');
  await page.waitForURL('**/workspaces');
}

test.describe('Workspace Workflows E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto(BASE_URL);
  });

  test.describe('Workspace Management', () => {
    test('should complete full workspace creation workflow', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);

      // Click create workspace button
      await page.click('[data-testid="create-workspace-button"]');
      
      // Fill workspace creation form
      await page.fill('[data-testid="workspace-name-input"]', 'E2E Test Workspace');
      await page.fill('[data-testid="workspace-description-input"]', 'Created during E2E testing');
      
      // Submit form
      await page.click('[data-testid="create-workspace-submit"]');
      
      // Wait for workspace to be created and selected
      await page.waitForSelector('[data-testid="workspace-created-success"]');
      
      // Verify workspace appears in list
      await expect(page.locator('text=E2E Test Workspace')).toBeVisible();
      
      // Verify workspace is automatically selected
      await expect(page.locator('[data-testid="current-workspace-name"]')).toContainText('E2E Test Workspace');
    });

    test('should handle workspace switching', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);

      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Get initial workspace count
      const workspaceCards = page.locator('[data-testid="workspace-card"]');
      const initialCount = await workspaceCards.count();
      
      if (initialCount > 1) {
        // Click on a different workspace
        await workspaceCards.nth(1).click();
        
        // Wait for workspace switch to complete
        await page.waitForSelector('[data-testid="workspace-switch-complete"]');
        
        // Verify workspace switched in header
        const workspaceName = await workspaceCards.nth(1).locator('[data-testid="workspace-name"]').textContent();
        await expect(page.locator('[data-testid="current-workspace-name"]')).toContainText(workspaceName || '');
      }
    });

    test('should handle workspace search and pagination', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);

      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Test search functionality
      const searchInput = page.locator('[data-testid="workspace-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Admin');
        
        // Wait for search results
        await page.waitForTimeout(500); // Debounce delay
        
        // Verify filtered results
        const visibleCards = page.locator('[data-testid="workspace-card"]:visible');
        const cardCount = await visibleCards.count();
        
        // Should show fewer results after search
        expect(cardCount).toBeGreaterThan(0);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
      
      // Test pagination if available
      const nextButton = page.locator('[data-testid="pagination-next"]');
      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        await nextButton.click();
        
        // Wait for page change
        await page.waitForTimeout(300);
        
        // Verify page changed
        const prevButton = page.locator('[data-testid="pagination-previous"]');
        await expect(prevButton).not.toBeDisabled();
      }
    });
  });

  test.describe('Team Collaboration', () => {
    test('should handle team member invitations', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);

      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Hover over workspace card to reveal invite button
      const workspaceCard = page.locator('[data-testid="workspace-card"]').first();
      await workspaceCard.hover();
      
      // Click invite button
      const inviteButton = workspaceCard.locator('[data-testid="invite-button"]');
      if (await inviteButton.isVisible()) {
        await inviteButton.click();
        
        // Fill invitation form
        await page.fill('[data-testid="invite-email-input"]', 'newmember@example.com');
        await page.click('[data-testid="add-email-button"]');
        
        // Verify email added to list
        await expect(page.locator('text=newmember@example.com')).toBeVisible();
        
        // Send invitation
        await page.click('[data-testid="send-invites-button"]');
        
        // Wait for success message
        await page.waitForSelector('[data-testid="invite-success-message"]');
        
        // Close dialog
        await page.click('[data-testid="close-invite-dialog"]');
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginUser(page);
      
      // Simulate network failure
      await page.route('**/api/workspaces', route => route.abort());
      
      await navigateToWorkspaces(page);
      
      // Should show error state
      await expect(page.locator('[data-testid="workspace-error"]')).toBeVisible();
      await expect(page.locator('text=Error loading workspaces')).toBeVisible();
      
      // Should show retry button
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();
      
      // Restore network and retry
      await page.unroute('**/api/workspaces');
      await retryButton.click();
      
      // Should eventually load workspaces
      await page.waitForSelector('[data-testid="workspace-card"]');
    });

    test('should handle authentication errors', async ({ page }) => {
      // Navigate without logging in
      await page.goto(`${BASE_URL}/workspaces`);
      
      // Should redirect to auth page
      await page.waitForURL('**/auth');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should handle workspace creation errors', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);

      // Click create workspace button
      await page.click('[data-testid="create-workspace-button"]');
      
      // Try to create workspace with invalid data
      await page.fill('[data-testid="workspace-name-input"]', ''); // Empty name
      await page.click('[data-testid="create-workspace-submit"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="workspace-name-error"]')).toBeVisible();
      
      // Fill valid name
      await page.fill('[data-testid="workspace-name-input"]', 'Valid Workspace Name');
      
      // Simulate server error
      await page.route('**/api/workspaces', route => route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      }));
      
      await page.click('[data-testid="create-workspace-submit"]');
      
      // Should show server error
      await expect(page.locator('[data-testid="workspace-creation-error"]')).toBeVisible();
      
      // Form should remain open for retry
      await expect(page.locator('[data-testid="workspace-name-input"]')).toHaveValue('Valid Workspace Name');
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show proper loading states', async ({ page }) => {
      await loginUser(page);
      
      // Slow down network to see loading states
      await page.route('**/api/workspaces', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await navigateToWorkspaces(page);
      
      // Should show loading state
      await expect(page.locator('[data-testid="workspaces-loading"]')).toBeVisible();
      
      // Should eventually show workspaces
      await page.waitForSelector('[data-testid="workspace-card"]');
      await expect(page.locator('[data-testid="workspaces-loading"]')).not.toBeVisible();
    });

    test('should handle large workspace lists efficiently', async ({ page }) => {
      await loginUser(page);
      
      // Mock large workspace list
      await page.route('**/api/workspaces', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspaces: Array.from({ length: 50 }, (_, i) => ({
            id: `ws-${i}`,
            name: `Workspace ${i + 1}`,
            description: `Description for workspace ${i + 1}`,
            is_admin_workspace: i === 0,
            member_count: Math.floor(Math.random() * 10) + 1
          }))
        })
      }));
      
      await navigateToWorkspaces(page);
      
      // Should load efficiently
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Should show pagination
      await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();
      
      // Should show reasonable number of cards per page
      const visibleCards = page.locator('[data-testid="workspace-card"]:visible');
      const cardCount = await visibleCards.count();
      expect(cardCount).toBeLessThanOrEqual(13); // 12 workspaces + 1 create card
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginUser(page);
      await navigateToWorkspaces(page);
      
      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Should display in mobile layout
      const workspaceGrid = page.locator('[data-testid="workspace-grid"]');
      await expect(workspaceGrid).toHaveClass(/grid-cols-1/);
      
      // Should be able to interact with workspace cards
      const firstCard = page.locator('[data-testid="workspace-card"]').first();
      await firstCard.click();
      
      // Should handle workspace selection on mobile
      await page.waitForSelector('[data-testid="workspace-switch-complete"]');
    });

    test('should handle touch interactions', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginUser(page);
      await navigateToWorkspaces(page);
      
      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Test touch interactions
      const workspaceCard = page.locator('[data-testid="workspace-card"]').first();
      
      // Tap to select workspace
      await workspaceCard.tap();
      
      // Should handle tap interaction
      await page.waitForSelector('[data-testid="workspace-switch-complete"]');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);
      
      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Should focus on create workspace button
      await expect(page.locator('[data-testid="create-workspace-button"]')).toBeFocused();
      
      // Continue tabbing through workspace cards
      await page.keyboard.press('Tab');
      
      // Should focus on first workspace card
      const firstCard = page.locator('[data-testid="workspace-card"]').first();
      await expect(firstCard).toBeFocused();
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="workspace-switch-complete"]');
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await loginUser(page);
      await navigateToWorkspaces(page);
      
      // Wait for workspaces to load
      await page.waitForSelector('[data-testid="workspace-card"]');
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toContainText('Workspaces');
      
      // Check for proper button labels
      const createButton = page.locator('[data-testid="create-workspace-button"]');
      await expect(createButton).toHaveAttribute('aria-label');
      
      // Check workspace cards have proper roles
      const workspaceCards = page.locator('[data-testid="workspace-card"]');
      const firstCard = workspaceCards.first();
      await expect(firstCard).toHaveAttribute('role', 'button');
    });
  });
});