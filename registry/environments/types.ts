import type { SkyChoice } from '@/core/lighting';

/** Which side of the plot a feature (coast, road) is on. +y in plan is "south" (front). */
export type Side = 'north' | 'south' | 'east' | 'west';

export interface ScatterSpec {
  /** Element registry id (tree, conifer, palm-tree, boulder, …). */
  element: string;
  count: number;
  /** Distance band from the plot edge, meters. */
  band: [number, number];
  /** Uniform scale range applied to the element's default size. */
  scale: [number, number];
  /** Keep away from the coast side (for coastal presets). */
  inland?: boolean;
}

export interface HillSpec {
  /** Polar placement around the plot centre (angle 0 = east, counter-clockwise towards north). */
  angle: number;
  distance: number;
  radius: number;
  height: number;
  material: string;
  /** Snow-capped peaks. */
  snow?: boolean;
  /** Flattened rounded hill (true) or sharp mountain (false). */
  rounded?: boolean;
}

/**
 * An outdoor setting around the plot. Purely decorative: it never changes the house or the plot,
 * and adding one is a single file in this folder.
 */
export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  /** Two colours for the picker card. */
  swatch: [string, string];
  /** Material of the land around the plot. */
  ground: string;
  /** Suggested plot terrain and climate, applied when the user picks the preset. The plot uses
   *  the same ground as its surroundings (seamless) unless the setting calls for a lawn. */
  suggest: { terrain: string; latitude: number; sky: SkyChoice; hour?: number };
  /** Land ends on this side: a cliff drop or a beach into water. */
  coast?: {
    side: Side;
    /** Meters from the plot edge to the coastline. */
    distance: number;
    kind: 'cliff' | 'beach';
    /** Cliff height / how far below the land the water lies. */
    drop: number;
    water: string;
    /** Beach/cliff-top material near the edge. */
    edge?: string;
    rock?: string;
  };
  /** A lake beside the plot. */
  lake?: { side: Side; distance: number; width: number; length: number; water: string; shore: string };
  road?: { side: Side; distance: number; width: number };
  /** Simple neighbouring houses along the road. */
  neighbours?: number;
  hills?: HillSpec[];
  scatter: ScatterSpec[];
  /** Fog distance multiplier (haze in deserts, clarity in mountains). */
  haze?: number;
}
