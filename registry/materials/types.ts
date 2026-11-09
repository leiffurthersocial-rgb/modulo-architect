export type MaterialCategory = 'floor' | 'wall' | 'facade' | 'roof' | 'terrain' | 'furniture' | 'fixture';

export interface MaterialMaps {
  /** URLs (relative to /public or absolute). Wire-up is ready; v1 ships flat colours. */
  color?: string;
  normal?: string;
  roughness?: string;
  ao?: string;
}

export interface MaterialDef {
  id: string;
  name: string;
  categories: MaterialCategory[];
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  maps?: MaterialMaps;
  /** Size in meters of one texture repeat. */
  uvScale?: [number, number];
}
