# Modulo: Architect

A minimalist, browser-based 3D house and room planner. Sketch a floor plan, raise it into a building, add doors, windows, stairs and a roof, furnish it, design the exterior, then walk through it in first person. No account, no backend: projects live in your browser (IndexedDB) and travel as `.modulo.json` files or view-only links.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Other scripts:

```bash
pnpm lint && pnpm typecheck && pnpm test   # ESLint, tsc --noEmit, Vitest
pnpm build && pnpm start                   # production build
pnpm e2e                                   # Playwright (builds must exist; starts `pnpm start` on :3100)
```

Requires Node 20+. Zero environment variables. Deploys to Vercel as a standard Next.js app (`vercel.json` pins pnpm).

## Using it (30-second version)

- **Start designing** → press **R** and drag a room, or click a quick room (Bedroom, Kitchen…). Type `4x3` + Enter for exact sizes.
- Every number in the Inspector takes typing, math (`2.5*3`, `320cm`, `10' 6"`), ↑/↓ (Shift ×10, Alt ×0.1) or dragging its label.
- **W** draws walls (type a length + Enter while drawing; close the loop to make a room). **D** door, **N** window, **S** stairs.
- **Levels** panel (bottom left): add a floor, set the **floor height** directly.
- **3** Furnish: drag items from the catalog. **4** Exterior: facade, roof, terrain, sun, fence, outdoor shower… **5** Walk.
- **⌘/Ctrl K** finds every command; **?** lists shortcuts; **Tab** hides the UI.

## Architecture

```
app/                 routes: landing (/), editor (/editor), guest viewer (/view)
components/ui        design-system primitives (Button, NumberField, Segmented, Dialog, MaterialPicker…)
components/editor    editor chrome: TopBar, ToolRail, CatalogPanel, Inspector/*, LevelSwitcher, dialogs
core/model           Zod schema (versioned), migrations, ids, defaults, domain ops, footprints, io/share codec
core/geometry        pure math: vec2, polygons, wall graph (+ room detection), miters & opening cuts, roofs, stairs, sun
core/snapping        snapping engine (endpoints, midpoints, walls, angles, alignment, grid, axis lock)
core/history         command-pattern undo/redo on Immer patches (transactions + merge keys)
core/units           unit formatting and the safe expression evaluator
core/templates       starter projects
registry/            element registry (furniture/, outdoor/, openings/) and materials/
features/tools       view-agnostic tools (select, wall, room, opening, stair, place, measure)
features/scene       three.js scene pieces (merged walls, floors, instanced items, roofs, terrain, sun, overlays)
features/build       3D viewport: canvas, camera rig, input → tool events
features/plan        2D SVG plan view
features/walk        first-person walk mode, physics, touch controls, guest viewer
features/commands    single command list → palette, shortcuts, sheet
store/               zustand stores: document (+history), editor UI, user actions
```

Key ideas:

- **The document is plain JSON** (`core/model/schema.ts`), validated with Zod and versioned with migrations. Geometry is never stored; meshes are generated from parameters.
- **Walls share nodes**, so moving a wall or corner reshapes adjacent walls and rooms. Rooms are the faces of the planar wall graph.
- **Tools are view-agnostic.** Both the 2D and 3D views turn pointer input into plan-space `ToolPointerEvent`s and render the overlay primitives the tool publishes. Each tool implements `onPointerDown/Move/Up`, `onKeyDown`, and `hint()`; its overlay is its `renderOverlay` equivalent.
- **Every surface references a material id** from the material registry.

## Extending

### Add a furniture item (one file)

Create `registry/furniture/bar-stool.ts`:

```ts
import { Armchair } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'bar-stool',
  name: 'Bar stool',
  kind: 'furniture',
  category: 'Kitchen',
  icon: Armchair,
  size: { w: 0.4, d: 0.4, h: 0.75 },
  slots: { seat: { label: 'Seat', default: 'wood-oak', category: 'furniture' } },
  snap: 'floor',
  build: ({ size: { w, h } }) => [
    cyl(w / 2, 0.05, 0, h - 0.05, 0, 'seat'),
    cyl(0.02, h - 0.05, 0, 0, 0, 'metal-black'),
  ],
});
```

…and list it in `registry/furniture/index.ts`. The catalog, search, inspector (size, materials, `params`), snapping, collision hints, instancing and walk-mode collision all pick it up. Parts are boxes / cylinders / spheres in a local frame (origin at the footprint centre on the floor, +z = front). Set `model: { url }` later to swap in a GLB.

### Add an outdoor element

Same as above with `kind: 'outdoor'` and `snap: 'ground'`, in `registry/outdoor/` (see `outdoor-shower.ts`, the first "fun" element). `solid: false` with a low height makes it walkable (decks, paths).

### Add a material

Append to `MATERIALS` in `registry/materials/index.ts`:

```ts
M('tile-sage', 'Sage tile', ['floor', 'wall'], '#a7b49b', 0.3, 0, { maps: { color: '/textures/sage.jpg' }, uvScale: [0.6, 0.6] }),
```

Categories control where it appears (floor, wall, facade, roof, terrain, furniture, fixture).

### Add a door/window type

Create a file in `registry/openings/` with `defineOpening` (parts in a wall-local frame) and list it in `registry/openings/index.ts`.

## Docs

- [`DECISIONS.md`](./DECISIONS.md) — defaults and trade-offs.
- [`ROADMAP.md`](./ROADMAP.md) — what's next (textures first).
