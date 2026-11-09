# Roadmap

## Next (recommended order)

1. **Textures.** The material registry already accepts `maps` (color / normal / roughness) and `uvScale`, and walls/floors/roofs emit world-space UVs. Add a `/public/textures` set (oak, tiles, brick, render, roof tiles, grass) and a richer picker with thumbnails.
2. **Element library growth.** Hot tub, pergola variants, garden beds, BBQ, trampoline, bikes, more vehicles, lighting with real light sources. One file per element in `registry/furniture` or `registry/outdoor`.
3. **GLB models.** `ElementDef.model` is reserved; add a `useGLTF` path in `ItemsLayer` with the procedural parts as a fallback/LOD.
4. **More building elements.** U-shaped and spiral stairs, balconies, railings, dormers, multi-rectangle and polygonal roofs (straight skeleton), curved walls, columns, wall niches.
5. **Terrain sculpting** (height field with brush tools) and slopes under the house.

## Later

- Server-side share links and collaboration (see DECISIONS.md → Sharing).
- Thumbnails in the project list (render the canvas to an image on save).
- Room labels with custom tags; floor plan PDF/PNG export with a scale bar.
- Measure tool persisted as annotations; dimension chains on exterior walls.
- Merge/split rooms as explicit commands with previews (today: add or delete the dividing wall).
- Undo history panel; named versions.
- Wider accessibility audit of the canvas itself (keyboard-only drawing exists via typed lengths; add keyboard cursor movement on the plan).
