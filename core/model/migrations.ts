import { ProjectSchema, SCHEMA_VERSION, type Project } from './schema';
import { DEFAULT_SETTINGS } from './defaults';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

/**
 * Ordered migrations. `MIGRATIONS[n]` upgrades a document from version n to n + 1.
 * Version 0 was the pre-release format: no `settings`, no `exterior.sun`, rooms named `label`.
 */
export const MIGRATIONS: Record<number, (doc: AnyDoc) => AnyDoc> = {
  0: (doc) => {
    const levels = (doc.building?.levels ?? []).map((l: AnyDoc) => ({
      ...l,
      rooms: (l.rooms ?? []).map((r: AnyDoc) => {
        const { label, ...rest } = r;
        return { name: label ?? r.name ?? 'Room', ...rest };
      }),
    }));
    return {
      ...doc,
      schemaVersion: 1,
      building: { roofs: [], ...doc.building, levels },
      exterior: {
        items: [],
        facadeMaterial: 'render-white',
        ...doc.exterior,
        sun: doc.exterior?.sun ?? { hour: 15, month: 6 },
      },
      settings: { ...DEFAULT_SETTINGS, ...(doc.settings ?? {}) },
    };
  },
};

export type MigrateResult = { ok: true; project: Project; migrated: boolean } | { ok: false; error: string };

export function migrateProject(raw: unknown): MigrateResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Not a Modulo project file.' };
  let doc = raw as AnyDoc;
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    return { ok: false, error: `This project was made with a newer version of Modulo (v${version}).` };
  }
  const migrated = version < SCHEMA_VERSION;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return { ok: false, error: `No migration from schema v${version}.` };
    doc = step(doc);
    version += 1;
  }
  const parsed = ProjectSchema.safeParse(doc);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `Invalid project: ${issue?.path.join('.') || 'root'} ${issue?.message ?? ''}`.trim(),
    };
  }
  return { ok: true, project: parsed.data, migrated };
}
