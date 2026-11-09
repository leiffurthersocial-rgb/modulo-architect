import { useEditor } from '@/store/editor';
import { getTool } from './index';
import type { ToolPointerEvent } from './types';

const current = () => getTool(useEditor.getState().tool);

export const dispatch = {
  down: (e: ToolPointerEvent) => current().onPointerDown?.(e) ?? false,
  move: (e: ToolPointerEvent) => current().onPointerMove?.(e),
  up: (e: ToolPointerEvent) => current().onPointerUp?.(e),
  dbl: (e: ToolPointerEvent) => current().onDoubleClick?.(e),
  key: (e: KeyboardEvent) => current().onKeyDown?.(e) ?? false,
};

/** Activate/deactivate tools as the editor's tool changes. Call once. */
export function installToolLifecycle() {
  let prev = useEditor.getState().tool;
  let prevPlace = useEditor.getState().place;
  getTool(prev).onActivate?.();
  return useEditor.subscribe((s) => {
    if (s.tool !== prev || s.place !== prevPlace) {
      getTool(prev).onDeactivate?.();
      prev = s.tool;
      prevPlace = s.place;
      getTool(prev).onActivate?.();
    }
  });
}
