import type { Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const shotDir = 'e2e/screenshots';

export async function project(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__modulo.doc.getState().project);
}

export async function editorState(page: Page): Promise<any> {
  return page.evaluate(() => {
    const s = (window as any).__modulo.editor.getState();
    return { mode: s.mode, tool: s.tool, selection: s.selection, view: s.view };
  });
}

export async function openEmpty(page: Page) {
  await page.addInitScript(() => localStorage.setItem('modulo:onboarded', '1'));
  await page.goto('/editor?template=empty');
  await page.waitForFunction(() => !!(window as any).__modulo);
  await page.waitForTimeout(800);
}

/** Center of the 2D viewport in client coordinates and a plan→client mapper. */
export async function planToClient(page: Page, x: number, y: number) {
  await page.waitForSelector('[data-testid="viewport-2d"] svg');
  return page.evaluate(
    ([px, py]) => {
      const el = document.querySelector('[data-testid="viewport-2d"]')!.getBoundingClientRect();
      const svg = document.querySelector('[data-testid="viewport-2d"] svg')! as SVGSVGElement;
      const vb = svg.viewBox.baseVal;
      return {
        x: el.left + ((px! - vb.x) / vb.width) * el.width,
        y: el.top + ((py! - vb.y) / vb.height) * el.height,
      };
    },
    [x, y],
  );
}
