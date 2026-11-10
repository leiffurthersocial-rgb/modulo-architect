import { expect, test } from '@playwright/test';
import { openEmpty, planToClient, project, shotDir } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function openTemplate(page: any, t: string) {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto(`/editor?template=${t}`);
  await page.waitForFunction(() => !!(window as any).__modulo);
  await page.waitForTimeout(2500);
}

test('3D: a window goes on the wall under the cursor, not the wall behind it', async ({ page }) => {
  await openTemplate(page, 'two-bedroom');
  const p = await project(page);
  const l = p.building.levels[0];
  const node = (id: string) => l.nodes.find((n: any) => n.id === id);
  // East exterior wall at x = 5.5 spanning y = 1.8.
  const east = l.walls.find((w: any) => {
    const a = node(w.a);
    const b = node(w.b);
    return (
      Math.abs(a.x - 5.5) < 1e-6 &&
      Math.abs(b.x - 5.5) < 1e-6 &&
      Math.min(a.y, b.y) < 1.2 &&
      Math.max(a.y, b.y) > 1.2
    );
  });
  expect(east).toBeTruthy();
  await page.keyboard.press('n');
  // Aim high on the outer face; the floor point under that ray lies inside, behind the wall.
  const target = await page.evaluate(() =>
    (window as any).__modulo.views['3d'].worldToClient({ x: 5.61, y: 1.2, h: 2.2 }),
  );
  await page.mouse.move(target.x - 30, target.y, { steps: 4 });
  await page.mouse.move(target.x, target.y, { steps: 4 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shotDir}/v2-window-ghost.png` });
  await page.mouse.click(target.x, target.y);
  const after = await project(page);
  const added = after.building.levels[0].openings.find(
    (o: any) => !l.openings.some((x: any) => x.id === o.id),
  );
  expect(added).toBeTruthy();
  expect(added.wallId).toBe(east.id);
});

test('view mode locks editing', async ({ page }) => {
  await openTemplate(page, 'studio');
  const before = await project(page);
  await page.getByTestId('view-mode-toggle').click();
  await expect(page.getByTestId('view-mode-pill')).toBeVisible();
  // Tools other than select/measure disappear; shortcuts do nothing.
  await expect(page.getByTestId('tool-wall')).toHaveCount(0);
  await page.keyboard.press('r');
  const item = before.building.levels[0].items[0];
  await page.evaluate((id: string) => (window as any).__modulo.editor.getState().select([id]), item.id);
  await page.keyboard.press('Delete');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Control+z');
  expect(await project(page)).toEqual(before);
  await expect(page.getByTestId('inspector').locator('input').first()).toBeDisabled();
  await page.screenshot({ path: `${shotDir}/v2-view-mode.png` });
  await page.keyboard.press('Shift+V');
  await expect(page.getByTestId('view-mode-pill')).toHaveCount(0);
  await expect(page.getByTestId('tool-wall')).toBeVisible();
});

test('delete a single wall keeps the floor; remove and re-add a floor; free floor slab', async ({ page }) => {
  await openEmpty(page);
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('r');
  const a = await planToClient(page, 0, 0);
  const b = await planToClient(page, 4, 3);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
  await page.keyboard.press('v');
  // Click the south wall (y = 3) and delete only it.
  const wallPt = await planToClient(page, 2, 3);
  await page.mouse.click(wallPt.x, wallPt.y);
  let p = await project(page);
  const sel = await page.evaluate(() => (window as any).__modulo.editor.getState().selection);
  expect(sel[0]).toMatch(/^w_/);
  await page.keyboard.press('Delete');
  p = await project(page);
  expect(p.building.levels[0].walls).toHaveLength(3);
  expect(p.building.levels[0].slabs).toHaveLength(1);
  await page.screenshot({ path: `${shotDir}/v2-wall-deleted.png` });
  await page.keyboard.press('Control+z');

  // Room floor: Delete removes only the floor; the Floor tool restores it.
  const inside = await planToClient(page, 1, 1);
  await page.mouse.click(inside.x, inside.y);
  await page.keyboard.press('Delete');
  p = await project(page);
  expect(p.building.levels[0].rooms[0].floor).toBe(false);
  expect(p.building.levels[0].walls).toHaveLength(4);
  await page.keyboard.press('g');
  await page.mouse.click(inside.x, inside.y);
  p = await project(page);
  expect(p.building.levels[0].rooms[0].floor).toBe(true);

  // Free floor slab by dragging outside the room.
  const s0 = await planToClient(page, 6, 0);
  const s1 = await planToClient(page, 9, 2);
  await page.mouse.move(s0.x, s0.y);
  await page.mouse.down();
  await page.mouse.move(s1.x, s1.y, { steps: 6 });
  await page.mouse.up();
  p = await project(page);
  expect(p.building.levels[0].slabs).toHaveLength(1);
  await page.keyboard.press('Shift+Digit2');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shotDir}/v2-floors-3d.png` });
});

test('settings panel changes preferences and project settings', async ({ page }) => {
  await openEmpty(page);
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('settings')).toBeVisible();
  await page.screenshot({ path: `${shotDir}/v2-settings.png` });
  await page.getByRole('radio', { name: 'Imperial (ft)' }).click();
  expect((await project(page)).settings.units).toBe('imperial');
  await page.getByRole('switch', { name: 'Shadows' }).click();
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('modulo:prefs') ?? '{}'));
  expect(prefs.shadows).toBe(false);
});

test('new catalog elements are placeable', async ({ page }) => {
  await openEmpty(page);
  await page.keyboard.press('Digit4');
  await page.getByPlaceholder('Search outdoor elements').fill('hot tub');
  await page.getByTestId('catalog-hot-tub').click();
  const c = await page.evaluate(() =>
    (window as any).__modulo.views['3d'].worldToClient({ x: 3, y: 3, h: 0 }),
  );
  await page.mouse.move(c.x - 20, c.y, { steps: 3 });
  await page.mouse.move(c.x, c.y, { steps: 3 });
  await page.mouse.click(c.x, c.y);
  const p = await project(page);
  expect(p.exterior.items.map((i: any) => i.type)).toEqual(['hot-tub']);
});

test('stairs open the floor above, and the opening can be toggled', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto('/editor?template=two-storey');
  await page.waitForFunction(() => !!(window as any).__modulo);
  const p = await project(page);
  const [ground, upper] = p.building.levels;
  // Upper floor in 2D shows the stairwell.
  await page.evaluate((id: string) => {
    const e = (window as any).__modulo.editor.getState();
    e.setActiveLevel(id);
    e.setView('2d');
  }, upper.id);
  await expect(page.getByTestId('stair-void')).toHaveCount(1);
  await page.screenshot({ path: `${shotDir}/v3-stairwell-2d.png` });
  // 3D with all levels visible.
  await page.evaluate(() => {
    const e = (window as any).__modulo.editor.getState();
    e.setView('3d');
    e.setLevelDisplay('isolate');
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${shotDir}/v3-stairwell-3d.png` });
  // Toggle it off from the stair inspector on the ground floor.
  await page.evaluate(
    ([gid, sid]: string[]) => {
      const e = (window as any).__modulo.editor.getState();
      e.setActiveLevel(gid);
      e.select([sid]);
    },
    [ground.id, ground.stairs[0].id],
  );
  await page.getByRole('switch', { name: 'Cut an opening in the floor above' }).click();
  expect((await project(page)).building.levels[0].stairs[0].opening).toBe(false);
  await page.evaluate((id: string) => {
    const e = (window as any).__modulo.editor.getState();
    e.setActiveLevel(id);
    e.setView('2d');
  }, upper.id);
  await expect(page.getByTestId('stair-void')).toHaveCount(0);
});
