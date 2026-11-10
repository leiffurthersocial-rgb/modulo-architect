export type MaterialCategory = 'floor' | 'wall' | 'facade' | 'roof' | 'terrain' | 'furniture' | 'fixture';

export interface MaterialMaps {
  /** Base colour (sRGB). For tinted materials this is a neutral greyscale detail map. */
  color?: string;
  /** OpenGL-convention normal map. */
  normal?: string;
  /** Packed glTF-style map: R = ambient occlusion, G = roughness, B = metalness. */
  arm?: string;
  /** Small preview for pickers. */
  thumb?: string;
}

export interface MaterialDef {
  id: string;
  name: string;
  categories: MaterialCategory[];
  /** Display colour (plan view tint, swatch fallback). For textured, untinted materials the
   *  average colour of the scan; for tinted ones the tint itself. */
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  maps?: MaterialMaps;
  /** Size in meters of one texture repeat [u, v]. */
  uvScale?: [number, number];
  /** True when `color` multiplies a neutral detail map (paints, fabrics, carpets). */
  tinted?: boolean;
  /** Normal map strength. */
  normalScale?: number;
  /** Rotate the texture (radians), e.g. to run boards the other way. */
  rotation?: number;
  /** Multiplies an untinted scan (lighten dark scans, e.g. white sand). */
  brightness?: number;
  /** Break up visible repetition on large surfaces (terrain). Defaults to true for terrain. */
  antiTile?: boolean;
  /** Optional group label inside a category (pickers group by it). */
  group?: string;
  /** Credit for scanned textures. */
  source?: string;
}
