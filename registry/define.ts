import type { ElementDef, OpeningDef } from './types';

/** Identity helpers that give element files full type inference. */
export const defineElement = (def: ElementDef): ElementDef => def;
export const defineOpening = (def: OpeningDef): OpeningDef => def;
