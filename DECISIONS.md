# Decisions

Defaults chosen while building autonomously. Each is easy to revisit.

## Stack

- **Next.js 16 (App Router) + React 19, TypeScript 5.9 strict** (`noUncheckedIndexedAccess` on). TypeScript 7 (native) was available but Next's type-check step still targets the JS compiler API, so 5.9 is pinned.
- **ESLint 9** rather than 10: `eslint-config-next` plugins were not yet verified on 10.
- **React Compiler lint rules** (`react-hooks/refs`, `set-state-in-effect`, `immutability`, `purity`) are warnings, not errors. The 3D layer intentionally mutates three.js objects and keeps gesture state in refs; the rules are still visible in CI output.
- **Radix via the unified `radix-ui` package**, styled directly with Tailwind tokens (no shadcn copy-paste layer: fewer files, same primitives).
- **`cmdk`** for the command palette. **`camera-controls`** (through drei's `<CameraControls>`) for damping, zoom-to-cursor and animated presets.
- **Geist** via the `geist` npm package (bundled font files: builds work offline and on Vercel without fetching Google Fonts).
- **pnpm** (lockfile committed), Node ≥ 20. Zero environment variables.

## Model

- **Meters and radians** everywhere internally; units converted only in `core/units`.
- **Plan space** is `(x, y)` with +y pointing "south" (down on screen); it maps to world `(x, *, z)`. North is −y, adjustable per site with `northAngle`.
- **Walls reference shared nodes** (`Level.nodes`). Moving a node moves every wall on it, so rooms (stored as node loops) follow automatically. This is the simplest robust way to satisfy "moving a wall updates adjacent rooms".
- **Rooms are derived from the planar wall graph** (minimal-face detection) and reconciled after every topology change: surviving loops keep their id, name and finishes; a split hands properties to both halves; a merged loop keeps one room.
- Adding a wall that crosses others splits both, so the graph stays planar. Removing a wall heals collinear neighbours back into one wall.
- **Level elevation is stored but always restacked** (`elevation[i] = elevation[i-1] + height[i-1]`). "Floor height" means floor-to-floor; walls inherit it unless overridden (`height: null`).
- **Roofs** are parametric on an oriented rectangle (`auto` = fitted to the level's walls on every edit). Gable/hip/shed/flat; gable ends are filled with facade material.
- **Facades:** exterior wall faces are detected geometrically (is the face's outside inside any room?). They use `wall.facade ?? exterior.facadeMaterial`; interior faces use the wall's own paint.
- Furniture lives on levels; **outdoor items live in `exterior.items`** on the terrain.
- Doors in walk mode are passable openings; leaves animate open when you approach (nice-to-have done cheaply).

## Granular walls and floors (v2)

- Floors exist in two forms: a room's own floor (`room.floor`, toggleable) and free **slabs** (`level.slabs`, schema-additive with a default, so v1 files still load).
- Deleting one wall never takes floors with it: rooms whose enclosure breaks (and are not merged into a neighbour) leave their floor behind as a slab.
- Delete on a room removes its floor only; a second Delete (or "Delete room & walls") removes the walls only that room uses.

## Picking walls in 3D (v2)

- Tools receive both the working-plane point and the actual surface hit point. Doors, windows and wall-snapped items prefer the wall under the cursor, so aiming at a wall face above the floor no longer lands on a wall behind it.

## View mode and preferences (v2)

- View mode reuses the document's read-only flag (the same one the shared viewer uses): mutations, transactions and undo/redo are no-ops, and the inspector renders inside a disabled `<fieldset>`.
- Personal preferences (theme, snap step, shadows, grid, walk tuning, new-wall thickness) live in `localStorage` (`store/prefs.ts`); project settings stay in the file.

## History

- **Command pattern on Immer patches**: each command stores forward + inverse patches. Drags/scrubs use `begin` / `commit` transactions (one undo step); repeated arrow-key nudges on a field merge via a `mergeKey` within 1.2 s. Normalisation that must follow geometry edits (auto-roof refit) runs inside every mutation so it is undone with it.

## Rendering

- All walls of a level are **one merged BufferGeometry** with material groups and a triangle→wall id table, so picking stays exact and draw calls stay low.
- Identical items (type + size + params + materials) render as **InstancedMeshes**, one per part.
- Opening cuts are exact without a CSG library: walls are straight prisms, so the footprint is sliced along the wall axis and void height ranges are dropped.
- `frameloop="demand"`; heavy modules (three, the 2D plan, walk mode) are dynamically imported, so the landing page ships no WebGL code.
- The landing hero is an inline SVG illustration (instead of a live 3D house) to keep the first load tiny.

## Interaction

- In 3D, the **select tool orbits with left-drag on empty space**; Shift-drag box-selects. Drawing tools take the left button and move orbit to the right button. In 2D, left-drag on empty space is a marquee; middle/right/Space-drag pans.
- Smart snap steps are chosen so one step is ≥ 12 px on screen: 5 cm, 10 cm, 25 cm, 50 cm, 1 m … `Alt` bypasses snapping, `Shift` locks to an axis.
- Single-letter shortcuts: V W R D N S F M; modes 1–5; views Shift+1/2/3; `Z` fit; `U` units; `Shift+S` snapping; `H` hide; `[`/`]` rotate; Tab hides UI; `?` shortcut sheet; ⌘/Ctrl+K palette.
- Phones (coarse pointer, ≤ 640 px) open straight into Walk mode with a note that editing needs a larger screen.

## Sharing

- **View-only links** compress the project (deflate-raw + base64url) into the URL hash (`/view#p=…`). The hash is never sent to a server. Large projects produce long links; the dialog shows the size and offers the file instead.
- **Future server-side links:** `features/project/io.ts#createShareLink` is the single seam. A backend can store the JSON and return `/view/<id>`; the viewer already accepts any `Project` and runs read-only (`useDocument.load(p, { readOnly: true })`).

## Testing

- Vitest for pure code (geometry, snapping, history, units/expressions, io, migrations, persistence via `fake-indexeddb`, registry sanity, walk physics, templates).
- Playwright drives the production build with SwiftShader WebGL. The editor exposes a read-only `window.__modulo` handle so tests can assert on the document instead of pixels.
