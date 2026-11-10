import { expect, test } from '@playwright/test';
import { project, shotDir } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function open(page: any, t: string) {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto(`/editor?template=${t}`);
  await page.waitForFunction(() => !!(window as any).__modulo);
}

test('surroundings preset, light temperature and a real 3D model', async ({ page }) => {
  await open(page, 'two-bedroom');
  await page.keyboard.press('Digit4');
  await page.getByRole('radio', { name: 'House & site' }).click();
  await page.getByTestId('env-cliffside').click();
  let p = await project(page);
  expect(p.site.environment).toBe('cliffside');
  // The plot matches the surrounding ground.
  expect(p.site.terrainMaterial).toBe('rough-grass');

  // Lighting: switch to manual temperature and warm it up with the keyboard.
  await page.getByTestId('open-lighting').click();
  const popover = page.locator('[data-radix-popper-content-wrapper]').getByTestId('light-panel');
  await expect(popover).toBeVisible();
  const thumb = popover.getByTestId('light-temperature').getByRole('slider');
  await thumb.focus();
  for (let i = 0; i < 20; i++) await thumb.press('ArrowLeft');
  p = await project(page);
  expect(p.lighting.temperatureAuto).toBe(false);
  expect(p.lighting.temperature).toBeLessThan(5600);
  await page.screenshot({ path: `${shotDir}/v4-lighting.png` });
  await page.keyboard.press('Escape');

  // Place a scanned model from the furniture catalog.
  await page.keyboard.press('Digit3');
  await page.getByPlaceholder('Search furniture').fill('chesterfield');
  await page.getByTestId('catalog-m-sofa-02').click();
  const c = await page.evaluate(() =>
    (window as any).__modulo.views['3d'].worldToClient({ x: -3, y: 0, h: 0 }),
  );
  await page.mouse.move(c.x - 20, c.y, { steps: 3 });
  await page.mouse.move(c.x, c.y, { steps: 3 });
  await page.waitForTimeout(800);
  await page.mouse.click(c.x, c.y);
  p = await project(page);
  expect(p.building.levels[0].items.some((i: any) => i.type === 'm-sofa-02')).toBe(true);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${shotDir}/v4-model-placed.png` });
});

test('walk through a textured, lit interior', async ({ page }) => {
  await open(page, 'two-bedroom');
  await page.keyboard.press('Digit5');
  await expect(page.getByTestId('walk-view')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.keyboard.down('w');
  await page.waitForTimeout(2600);
  await page.keyboard.up('w');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${shotDir}/v4-walk.png` });
});
