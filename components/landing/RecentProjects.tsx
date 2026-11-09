'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listProjects, type ProjectMeta } from '@/lib/persistence';

function ago(t: number) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

export function RecentProjects() {
  const [items, setItems] = useState<ProjectMeta[] | null>(null);
  useEffect(() => {
    listProjects()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  if (!items || items.length === 0) return null;
  return (
    <section className="animate-fade" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">
        Continue
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.slice(0, 4).map((p) => (
          <li key={p.id}>
            <Link
              href={`/editor?project=${encodeURIComponent(p.id)}`}
              className="flex flex-col rounded-[12px] border border-line bg-panel-solid px-3.5 py-2.5 text-sm transition-colors hover:border-line-strong hover:bg-hover"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-fg-subtle">{ago(p.updatedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
