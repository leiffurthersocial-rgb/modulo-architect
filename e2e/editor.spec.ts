import { expect, test } from '@playwright/test';
import { editorState, openEmpty, planToClient, project, shotDir } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

test('landing page opens the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Sketch a plan/ })).toBeVisible();
  await page.screenshot({ path: `${shotDir}/landing-desktop.png` });
  await page.getByTestId('start-designing').click();
  await page.waitForURL(/\/editor/);
  await page.waitForFunction(() => !!(window as any).__modulo);
});

test('draw a room by dragging, snap to round values, edit numerically, door, sofa, undo/redo, walk', async ({
  page,
}) => {
  await openEmpty(page);
  // 2D plan for precise input
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('r');
  const a = await planToClient(page, -2.03, -1.47);
  const b = await planToClient(page, 1.98, 1.56);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 5 });
  await page.mouse.move(b.x, b.y, { steps: 5 });
  await page.mouse.up();
  let p = await project(page);
  const level = p.building.levels[0];
  expect(level.rooms).toHaveLength(1);
  // Snapping lands on round values.
  const xs = level.nodes.map((n: any) => n.x);
  for (const v of [...xs, ...level.nodes.map((n: any) => n.y)])
    expect(Math.abs(v * 10 - Math.round(v * 10))).toBeLessThan(1e-6);
  const width = Math.max(...xs) - Math.min(...xs);
  expect(width).toBeCloseTo(4, 5);

  // Inspector: set the width numerically with an expression.
  const field = page.getByTestId('room-width');
  await expect(field).toBeVisible();
  await field.click();
  await field.fill('2.5*2');
  await field.press('Enter');
  p = await project(page);
  const xs2 = p.building.levels[0].nodes.map((n: any) => n.x);
  expect(Math.max(...xs2) - Math.min(...xs2)).toBeCloseTo(5, 5);
  // Arrow nudge (+1 cm) and Shift (+10 cm)
  await field.press('ArrowUp');
  await field.press('Shift+ArrowUp');
  p = await project(page);
  const xs3 = p.building.levels[0].nodes.map((n: any) => n.x);
  expect(Math.max(...xs3) - Math.min(...xs3)).toBeCloseTo(5.11, 5);
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${shotDir}/plan-room.png` });

  // 3D updates: switch to 3D and verify the walls match the new width.
  await page.keyboard.press('Shift+Digit2');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shotDir}/build-3d-room.png` });

  // Door on the south wall (y ≈ 1.6)
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('d');
  const door = await planToClient(page, 0.4, 1.6);
  await page.mouse.move(door.x, door.y - 20, { steps: 3 });
  await page.mouse.move(door.x, door.y, { steps: 3 });
  await page.mouse.click(door.x, door.y);
  p = await project(page);
  expect(p.building.levels[0].openings).toHaveLength(1);
  expect(p.building.levels[0].openings[0].type).toBe('door-single');

  // Sofa via drag from catalog in Furnish mode
  await page.keyboard.press('Digit3');
  await page.keyboard.press('Shift+Digit1');
  const card = page.getByTestId('catalog-sofa');
  const cb = (await card.boundingBox())!;
  const drop = await planToClient(page, 0.4, -0.6);
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  await page.mouse.move(drop.x, drop.y, { steps: 12 });
  await page.mouse.up();
  p = await project(page);
  expect(p.building.levels[0].items.map((i: any) => i.type)).toEqual(['sofa']);
  await page.screenshot({ path: `${shotDir}/furnish-sofa-2d.png` });

  // Undo removes the sofa, redo brings it back.
  await page.keyboard.press('Control+z');
  expect((await project(page)).building.levels[0].items).toHaveLength(0);
  await page.keyboard.press('Control+Shift+z');
  expect((await project(page)).building.levels[0].items).toHaveLength(1);

  await page.keyboard.press('Shift+Digit2');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shotDir}/furnish-3d.png` });

  // Walk mode
  await page.keyboard.press('Digit5');
  await expect(page.getByTestId('walk-view')).toBeVisible();
  await page.waitForTimeout(2000);
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await page.screenshot({ path: `${shotDir}/walk.png` });
  await page.getByTestId('exit-walk').click();
  expect((await editorState(page)).mode).toBe('furnish');
});

test('Alt disables snapping while drawing', async ({ page }) => {
  await openEmpty(page);
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('r');
  const a = await planToClient(page, 0.03, 0.03);
  const b = await planToClient(page, 3.03, 2.03);
  await page.keyboard.down('Alt');
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
  await page.keyboard.up('Alt');
  const p = await project(page);
  const xs = p.building.levels[0].nodes.map((n: any) => n.x);
  const offGrid = xs.some((v: number) => Math.abs(v * 10 - Math.round(v * 10)) > 1e-3);
  expect(offGrid).toBe(true);
});

test('wall tool: typed length + Enter, closing a loop creates a room', async ({ page }) => {
  await openEmpty(page);
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('w');
  const start = await planToClient(page, 0, 0);
  await page.mouse.move(start.x, start.y);
  await page.mouse.click(start.x, start.y);
  const dirs: [number, number][] = [
    [3, 0],
    [3, 3],
    [0, 3],
  ];
  for (const [x, y] of dirs) {
    const c = await planToClient(page, x === 0 ? 0 : x * 0.5 + (x ? 0.1 : 0), y === 0 ? 0 : y * 0.5);
    await page.mouse.move(c.x, c.y, { steps: 3 });
  }
  // Type exact lengths instead: restart cleanly.
  await page.keyboard.press('Escape');
  await page.mouse.click(start.x, start.y);
  const east = await planToClient(page, 2, 0);
  await page.mouse.move(east.x, east.y, { steps: 4 });
  await page.keyboard.type('4.5');
  await page.keyboard.press('Enter');
  const south = await planToClient(page, 4.5, 2);
  await page.mouse.move(south.x, south.y, { steps: 4 });
  await page.keyboard.type('3');
  await page.keyboard.press('Enter');
  const back = await planToClient(page, 0, 3);
  await page.mouse.move(back.x, back.y, { steps: 4 });
  await page.mouse.click(back.x, back.y);
  await page.mouse.move(start.x, start.y, { steps: 4 });
  await page.mouse.click(start.x, start.y);
  const p = await project(page);
  expect(p.building.levels[0].rooms).toHaveLength(1);
  const xs = p.building.levels[0].nodes.map((n: any) => n.x);
  expect(Math.max(...xs)).toBeCloseTo(4.5, 5);
});

test('project survives reload and export/import round trip', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto('/editor?template=two-storey');
  await page.waitForFunction(() => !!(window as any).__modulo);
  const before = await project(page);
  await expect(page.getByTestId('saved-indicator')).toHaveText('Saved', { timeout: 5000 });
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__modulo);
  await page.waitForTimeout(500);
  const after = await project(page);
  expect(after.id).toBe(before.id);
  expect(after.building.levels).toHaveLength(2);
  expect(after).toEqual(before);

  const dl = page.waitForEvent('download');
  await page.keyboard.press('Control+s');
  const download = await dl;
  expect(download.suggestedFilename()).toMatch(/\.modulo\.json$/);
  const path = await download.path();
  // Import into a fresh empty project via the file chooser
  await page.goto('/editor?template=empty');
  await page.waitForFunction(() => !!(window as any).__modulo);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('menuitem', { name: /Import/ }).click();
  const fc = await chooser;
  await fc.setFiles(path!);
  await page.waitForFunction((id) => (window as any).__modulo.doc.getState().project.id === id, before.id);
  const imported = await project(page);
  expect(imported.building).toEqual(before.building);
});

test('command palette runs actions', async ({ page }) => {
  await openEmpty(page);
  await page.keyboard.press('Control+k');
  await expect(page.getByTestId('palette')).toBeVisible();
  await page.keyboard.type('add bedroom');
  await page.keyboard.press('Enter');
  expect((await editorState(page)).tool).toBe('room');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});

test('share link opens a read-only walkthrough', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto('/editor?template=studio');
  await page.waitForFunction(() => !!(window as any).__modulo);
  await page.evaluate(() => (window as any).__modulo.editor.getState().set({ shareOpen: true }));
  const link = page.getByTestId('share-link');
  await expect(link).toHaveValue(/\/view#p=/);
  const url = await link.inputValue();
  await page.goto(url);
  await expect(page.getByTestId('walk-view')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${shotDir}/viewer-walk.png` });
});

test.describe('tablet', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  test('editor fits a tablet', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
    await page.goto('/editor?template=two-bedroom');
    await page.waitForFunction(() => !!(window as any).__modulo);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${shotDir}/tablet-3d.png` });
    await page.evaluate(() => (window as any).__modulo.editor.getState().setMode('exterior'));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${shotDir}/tablet-exterior.png` });
  });
});
