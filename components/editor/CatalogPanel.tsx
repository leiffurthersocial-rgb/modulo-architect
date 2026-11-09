'use client';
import { ChevronLeft, Search, Sun } from 'lucide-react';
import { Slider } from 'radix-ui';
import { useMemo, useState } from 'react';
import { useEditor, type PlaceSpec, type ToolId } from '@/store/editor';
import { useDocument } from '@/store/document';
import { allOpenings, elementsOfKind, searchElements, type ElementDef } from '@/registry';
import { ROOM_TEMPLATES } from '@/features/tools/room';
import { Section } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { IconButton } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { SiteFields } from './inspector/SiteInspector';
import { formatArea, formatLength } from '@/core/units/units';
import * as A from '@/store/actions';
import { cn } from '@/lib/cn';
import { getWallThickness, setWallThickness } from '@/features/tools/wall';
import { DEFAULTS } from '@/core/model/defaults';

/** Start placing something: click = ghost follows the cursor; drag = drop where released. */
function startPlacing(tool: ToolId, place: PlaceSpec, e?: React.PointerEvent) {
  const ed = useEditor.getState();
  ed.setTool(tool, { ...place, dragging: !!e });
  if (e) {
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    const start = { x: e.clientX, y: e.clientY };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointerup', up);
      const moved = Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6;
      const p = useEditor.getState().place;
      // A click (no drag) switches to click-to-place.
      if (!moved && p) useEditor.getState().set({ place: { ...p, dragging: false } });
    };
    window.addEventListener('pointerup', up);
  }
}

function Card({
  label,
  sub,
  icon,
  active,
  onPick,
  testId,
}: {
  label: string;
  sub?: string;
  icon: React.ReactNode;
  active?: boolean;
  onPick: (e?: React.PointerEvent) => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        onPick(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
      className={cn(
        'group flex touch-none select-none flex-col items-center gap-1.5 rounded-[12px] border px-1.5 pb-2 pt-2.5 text-center transition-all duration-150',
        active ? 'border-accent bg-accent-soft' : 'border-transparent bg-bg-elevated hover:border-line-strong hover:bg-panel-solid',
      )}
    >
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-[10px] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.5]', active ? 'text-accent' : 'text-fg-muted group-hover:text-fg')}>{icon}</span>
      <span className="line-clamp-2 text-[11.5px] font-medium leading-tight text-fg">{label}</span>
      {sub && <span className="tnum text-[10.5px] leading-none text-fg-subtle">{sub}</span>}
    </button>
  );
}

function ElementGrid({ list }: { list: ElementDef[] }) {
  const place = useEditor((s) => s.place);
  const units = useDocument((s) => s.project.settings.units);
  if (!list.length) return <p className="px-1 py-6 text-center text-[13px] text-fg-subtle">Nothing matches. Try “chair” or “plant”.</p>;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {list.map((def) => {
        const Icon = def.icon;
        return (
          <Card
            key={def.id}
            testId={`catalog-${def.id}`}
            label={def.name}
            sub={`${formatLength(def.size.w, units, { unit: false, precision: 1 })}×${formatLength(def.size.d, units, { precision: 1 })}`}
            icon={<Icon />}
            active={place?.kind === 'element' && place.id === def.id}
            onPick={(e) => startPlacing('place', { kind: 'element', id: def.id }, e)}
          />
        );
      })}
    </div>
  );
}

function Catalog({ kind }: { kind: 'furniture' | 'outdoor' }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const all = useMemo(() => elementsOfKind(kind), [kind]);
  const cats = useMemo(() => ['All', ...Array.from(new Set(all.map((e) => e.category)))], [all]);
  const list = searchElements(q, kind).filter((e) => cat === 'All' || e.category === cat || q);
  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 pt-3">
        <label className="flex h-8 items-center gap-2 rounded-[9px] border border-line bg-bg-elevated px-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft">
          <Search className="h-3.5 w-3.5 text-fg-subtle" />
          <input
            data-catalog-search
            aria-label={`Search ${kind}`}
            placeholder={kind === 'furniture' ? 'Search furniture' : 'Search outdoor elements'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
              if (e.key === 'Enter' && list[0]) startPlacing('place', { kind: 'element', id: list[0].id });
            }}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-fg-subtle"
          />
        </label>
        <div className="scrollbar-thin -mx-3 mt-2 flex gap-1 overflow-x-auto px-3 pb-1" role="tablist" aria-label="Categories">
          {cats.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={cn('h-6 shrink-0 rounded-full px-2.5 text-xs font-medium transition-colors', cat === c ? 'bg-fg text-bg' : 'bg-active/60 text-fg-muted hover:text-fg')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3 pt-2">
        <ElementGrid list={list} />
        <p className="mt-3 text-center text-[11px] text-fg-subtle">Drag onto the canvas, or click then place. R rotates.</p>
      </div>
    </div>
  );
}

function BuildLibrary() {
  const place = useEditor((s) => s.place);
  const tool = useEditor((s) => s.tool);
  const units = useDocument((s) => s.project.settings.units);
  const [thick, setThick] = useState(getWallThickness() === DEFAULTS.interiorWallThickness ? 'interior' : 'exterior');
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <Section title="Quick rooms">
        <div className="grid grid-cols-3 gap-1.5">
          {ROOM_TEMPLATES.map((t) => (
            <Card
              key={t.id}
              testId={`room-template-${t.id}`}
              label={t.name}
              sub={formatArea(t.w * t.h, units)}
              icon={<RoomGlyph w={t.w} h={t.h} />}
              active={place?.kind === 'room-template' && place.id === t.id}
              onPick={(e) => startPlacing('room', { kind: 'room-template', id: t.id }, e)}
            />
          ))}
        </div>
      </Section>
      <Section title="Doors & windows">
        <div className="grid grid-cols-3 gap-1.5">
          {allOpenings().map((o) => {
            const Icon = o.icon;
            return (
              <Card
                key={o.id}
                testId={`opening-${o.id}`}
                label={o.name}
                sub={formatLength(o.defaults.width, units, { precision: 2 })}
                icon={<Icon />}
                active={tool === 'opening' && place?.kind === 'opening' && place.id === o.id}
                onPick={(e) => startPlacing('opening', { kind: 'opening', id: o.id }, e)}
              />
            );
          })}
        </div>
      </Section>
      <Section title="Walls">
        <Segmented
          ariaLabel="New wall thickness"
          size="sm"
          value={thick}
          onChange={(v) => {
            setThick(v);
            setWallThickness(v === 'interior' ? DEFAULTS.interiorWallThickness : DEFAULTS.wallThickness);
          }}
          options={[
            { value: 'exterior', label: `Exterior ${formatLength(DEFAULTS.wallThickness, units)}` },
            { value: 'interior', label: `Interior ${formatLength(DEFAULTS.interiorWallThickness, units)}` },
          ]}
        />
      </Section>
      <Section title="Stairs & roof">
        <div className="grid grid-cols-3 gap-1.5">
          <Card label="Straight stairs" icon={<StairGlyph />} active={tool === 'stair' && !place} onPick={(e) => startPlacing('stair', { kind: 'element', id: 'straight' }, e)} testId="stair-straight" />
          <Card label="L-shaped stairs" icon={<StairGlyph l />} active={tool === 'stair' && place?.id === 'l-shaped'} onPick={(e) => startPlacing('stair', { kind: 'element', id: 'l-shaped' }, e)} />
          <Card label="Gable roof" icon={<RoofGlyph type="gable" />} onPick={() => A.addRoof('gable')} testId="roof-gable" />
          <Card label="Hip roof" icon={<RoofGlyph type="hip" />} onPick={() => A.addRoof('hip')} />
          <Card label="Shed roof" icon={<RoofGlyph type="shed" />} onPick={() => A.addRoof('shed')} />
          <Card label="Flat roof" icon={<RoofGlyph type="flat" />} onPick={() => A.addRoof('flat')} />
        </div>
      </Section>
    </div>
  );
}

function ExteriorLibrary() {
  const facade = useDocument((s) => s.project.exterior.facadeMaterial);
  const sun = useDocument((s) => s.project.exterior.sun);
  const [tab, setTab] = useState<'elements' | 'site'>('elements');
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pt-3">
        <Segmented
          ariaLabel="Exterior panel"
          size="sm"
          value={tab}
          onChange={setTab}
          className="w-full [&>button]:flex-1"
          options={[
            { value: 'elements', label: 'Elements' },
            { value: 'site', label: 'House & site' },
          ]}
        />
      </div>
      {tab === 'elements' ? (
        <Catalog kind="outdoor" />
      ) : (
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <Section title="Facade">
            <MaterialPicker
              label="Whole house"
              category="facade"
              value={facade}
              onChange={(id) =>
                useDocument.getState().mutate('House facade', (d) => {
                  d.exterior.facadeMaterial = id;
                  for (const l of d.building.levels) for (const w of l.walls) delete w.facade;
                })
              }
            />
            <p className="text-xs text-fg-subtle">Click a single wall to give it its own cladding.</p>
          </Section>
          <Section title="Roof">
            <div className="grid grid-cols-4 gap-1.5">
              {(['gable', 'hip', 'shed', 'flat'] as const).map((t) => (
                <Card key={t} label={t[0]!.toUpperCase() + t.slice(1)} icon={<RoofGlyph type={t} />} onPick={() => A.addRoof(t)} />
              ))}
            </div>
          </Section>
          <Section title="Plot & terrain">
            <SiteFields />
          </Section>
          <Section title="Sun & time of day">
            <SunControls hour={sun.hour} month={sun.month} />
          </Section>
        </div>
      )}
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SunControls({ hour, month }: { hour: number; month: number }) {
  const set = (patch: Partial<{ hour: number; month: number }>, label: string) =>
    useDocument.getState().mutate(label, (d) => void Object.assign(d.exterior.sun, patch), { mergeKey: label });
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Sun className="h-4 w-4 text-fg-subtle" />
        <SliderRow label="Time of day" min={5} max={21} step={0.25} value={hour} onChange={(v) => set({ hour: v }, 'Time of day')} />
        <span className="tnum w-11 text-right text-[13px]">{`${h}:${String(m).padStart(2, '0')}`}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-4 text-center text-[11px] text-fg-subtle">M</span>
        <SliderRow label="Month" min={1} max={12} step={1} value={month} onChange={(v) => set({ month: v }, 'Month')} />
        <span className="w-11 text-right text-[13px]">{MONTHS[month - 1]}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <Slider.Root className="relative flex h-5 flex-1 touch-none select-none items-center" min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v!)} aria-label={label}>
      <Slider.Track className="relative h-1 grow rounded-full bg-active">
        <Slider.Range className="absolute h-full rounded-full bg-accent" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-line-strong bg-panel-solid shadow-sm focus-visible:outline-2 focus-visible:outline-accent" aria-label={label} />
    </Slider.Root>
  );
}

function RoomGlyph({ w, h }: { w: number; h: number }) {
  const s = 18 / Math.max(w, h);
  return (
    <svg viewBox="0 0 22 22" aria-hidden className="!h-6 !w-6">
      <rect x={11 - (w * s) / 2} y={11 - (h * s) / 2} width={w * s} height={h * s} rx={1} fill="none" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function StairGlyph({ l }: { l?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" aria-hidden className="!h-6 !w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {l ? <path d="M4 18h5v-4h4v-4h5V4" /> : <path d="M3 19h4v-4h4v-4h4V7h4V3" />}
    </svg>
  );
}

function RoofGlyph({ type }: { type: 'gable' | 'hip' | 'shed' | 'flat' }) {
  const d = { gable: 'M3 15 11 6l8 9M5 15v4h12v-4', hip: 'M2 15l5-7h8l5 7M5 15v4h12v-4', shed: 'M3 10l16-4v13H3z', flat: 'M3 9h16v2H3zM5 11v8h12v-8' }[type];
  return (
    <svg viewBox="0 0 22 22" aria-hidden className="!h-6 !w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function CatalogPanel() {
  const mode = useEditor((s) => s.mode);
  const open = useEditor((s) => s.catalogOpen);
  const readOnly = useDocument((s) => s.readOnly);
  if (mode === 'walk' || readOnly) return null;
  const title = mode === 'furnish' ? 'Furniture' : mode === 'exterior' ? 'Exterior' : 'Build';
  if (!open)
    return (
      <button
        onClick={() => useEditor.getState().set({ catalogOpen: true })}
        className="panel pointer-events-auto h-9 px-3 text-[13px] font-medium text-fg-muted hover:text-fg"
        aria-label={`Open ${title} library`}
      >
        {title}
      </button>
    );
  return (
    <aside aria-label={`${title} library`} className="panel animate-in pointer-events-auto flex max-h-full w-[268px] flex-col overflow-hidden" data-testid="catalog">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-line pl-4 pr-1.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <IconButton label="Collapse panel" size="sm" onClick={() => useEditor.getState().set({ catalogOpen: false })}>
          <ChevronLeft />
        </IconButton>
      </header>
      {mode === 'furnish' ? <Catalog kind="furniture" /> : mode === 'exterior' ? <ExteriorLibrary /> : <BuildLibrary />}
    </aside>
  );
}
