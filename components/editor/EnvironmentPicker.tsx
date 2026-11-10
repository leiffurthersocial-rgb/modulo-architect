'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { ENVIRONMENTS } from '@/registry/environments';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';
import { DEFAULT_LIGHTING } from '@/core/model/schema';

/** Apply an outdoor preset (and optionally its matching terrain, climate and sky). */
export function applyEnvironment(id: string, withClimate = true) {
  const preset = ENVIRONMENTS.find((e) => e.id === id);
  if (!preset) return;
  useDocument.getState().mutate(`Surroundings: ${preset.name}`, (d) => {
    d.site.environment = id;
    if (withClimate) {
      d.site.terrainMaterial = preset.suggest.terrain;
      d.site.latitude = preset.suggest.latitude;
      if (!d.lighting) d.lighting = { ...DEFAULT_LIGHTING };
      d.lighting.sky = preset.suggest.sky;
      if (preset.suggest.hour !== undefined) d.exterior.sun.hour = preset.suggest.hour;
    }
  });
  const ed = useEditor.getState();
  if (ed.mode !== 'exterior' && ed.mode !== 'walk') ed.setMode('exterior');
  ed.notify(`${preset.name}: ${preset.description.toLowerCase()}`);
}

export function EnvironmentPicker() {
  const current = useDocument((s) => s.project.site.environment ?? 'plain');
  const [climate, setClimate] = useState(true);
  return (
    <div className="flex flex-col gap-2" data-testid="environment-picker">
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Surroundings">
        {ENVIRONMENTS.map((e) => (
          <button
            key={e.id}
            role="radio"
            aria-checked={current === e.id}
            data-testid={`env-${e.id}`}
            onClick={() => applyEnvironment(e.id, climate)}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-[10px] text-left ring-1 transition-shadow',
              current === e.id ? 'ring-2 ring-accent' : 'ring-line hover:ring-line-strong',
            )}
          >
            <span
              className="h-11 w-full"
              style={{
                background: `linear-gradient(160deg, ${e.swatch[1]} 0%, ${e.swatch[1]} 38%, ${e.swatch[0]} 62%, ${e.swatch[0]} 100%)`,
              }}
            />
            <span className="px-2 py-1.5">
              <span className="block text-[12px] font-medium leading-tight">{e.name}</span>
              <span className="line-clamp-1 block text-[10.5px] text-fg-subtle">{e.description}</span>
            </span>
            {current === e.id && (
              <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-accent p-0.5 text-accent-fg" />
            )}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-2 text-[12px] text-fg-muted">
        Also set matching terrain, climate and sky
        <Switch label="Apply matching terrain, climate and sky" checked={climate} onChange={setClimate} />
      </label>
    </div>
  );
}
