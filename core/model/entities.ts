import type {
  EntityKind,
  Item,
  Level,
  Opening,
  Project,
  Roof,
  Room,
  Slab,
  Stair,
  Wall,
  Node,
} from './schema';

/** Ids carry a kind prefix (see ids.ts), so lookups never scan the wrong collection. */
export function kindOf(id: string): EntityKind | null {
  const p = id.slice(0, id.indexOf('_'));
  switch (p) {
    case 'n':
      return 'node';
    case 'w':
      return 'wall';
    case 'r':
      return 'room';
    case 'o':
      return 'opening';
    case 's':
      return 'stair';
    case 'i':
      return 'item';
    case 'rf':
      return 'roof';
    case 'sl':
      return 'slab';
    case 'l':
      return 'level';
    default:
      return id === 'site' ? 'site' : null;
  }
}

export type EntityRef =
  | { kind: 'node'; entity: Node; level: Level }
  | { kind: 'wall'; entity: Wall; level: Level }
  | { kind: 'room'; entity: Room; level: Level }
  | { kind: 'slab'; entity: Slab; level: Level }
  | { kind: 'opening'; entity: Opening; level: Level }
  | { kind: 'stair'; entity: Stair; level: Level }
  | { kind: 'item'; entity: Item; level: Level | null }
  | { kind: 'roof'; entity: Roof; level: Level | null }
  | { kind: 'level'; entity: Level; level: Level };

export function findEntity(project: Project, id: string): EntityRef | null {
  const kind = kindOf(id);
  const levels = project.building.levels;
  switch (kind) {
    case 'level': {
      const l = levels.find((x) => x.id === id);
      return l ? { kind, entity: l, level: l } : null;
    }
    case 'roof': {
      const r = project.building.roofs.find((x) => x.id === id);
      return r ? { kind, entity: r, level: levels.find((l) => l.id === r.levelId) ?? null } : null;
    }
    case 'item': {
      for (const l of levels) {
        const it = l.items.find((x) => x.id === id);
        if (it) return { kind, entity: it, level: l };
      }
      const ext = project.exterior.items.find((x) => x.id === id);
      return ext ? { kind, entity: ext, level: null } : null;
    }
    case 'node':
    case 'wall':
    case 'room':
    case 'opening':
    case 'slab':
    case 'stair': {
      const key = (
        {
          node: 'nodes',
          wall: 'walls',
          room: 'rooms',
          opening: 'openings',
          stair: 'stairs',
          slab: 'slabs',
        } as const
      )[kind];
      for (const l of levels) {
        const list = l[key] as { id: string }[];
        const e = list.find((x) => x.id === id);
        if (e) return { kind, entity: e, level: l } as EntityRef;
      }
      return null;
    }
    default:
      return null;
  }
}

export function entityLabel(ref: EntityRef): string {
  switch (ref.kind) {
    case 'wall':
      return 'Wall';
    case 'room':
      return ref.entity.name;
    case 'opening':
      return ref.entity.type.startsWith('door') ? 'Door' : 'Window';
    case 'stair':
      return 'Stairs';
    case 'slab':
      return 'Floor';
    case 'item':
      return ref.entity.name ?? 'Item';
    case 'roof':
      return 'Roof';
    case 'level':
      return ref.entity.name;
    case 'node':
      return 'Corner';
  }
}
