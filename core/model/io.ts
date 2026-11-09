import { migrateProject, type MigrateResult } from './migrations';
import type { Project } from './schema';

export const FILE_EXTENSION = '.modulo.json';

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function parseProject(text: string): MigrateResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  return migrateProject(raw);
}

export function projectFileName(project: Project): string {
  const slug =
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project';
  return `${slug}${FILE_EXTENSION}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Share links: deflate + base64url into the URL hash. Nothing leaves the browser.             */
/* ------------------------------------------------------------------------------------------ */

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

/** Compact JSON (no whitespace) → deflate-raw → base64url. */
export async function encodeShare(project: Project): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(project));
  return toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeShare(token: string): Promise<MigrateResult> {
  try {
    const bytes = await pipe(fromBase64Url(token), new DecompressionStream('deflate-raw'));
    return parseProject(new TextDecoder().decode(bytes));
  } catch {
    return { ok: false, error: 'This share link is damaged or incomplete.' };
  }
}
