'use client';
import { Lamp, SunMedium } from 'lucide-react';
import { Popover, Slider } from 'radix-ui';
import type { Draft } from 'immer';
import { useDocument } from '@/store/document';
import { DEFAULT_LIGHTING, type Lighting, type Project } from '@/core/model/schema';
import { SKIES, kelvinToHex, sunKelvin } from '@/core/lighting';
import { sunPosition } from '@/core/geometry/sun';
import { Switch } from '@/components/ui/Switch';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Warm → neutral → cool, matching the Kelvin scale left to right. */
const TEMP_GRADIENT = `linear-gradient(90deg, ${[1800, 2700, 3500, 4500, 5600, 6500, 8000, 11000].map(kelvinToHex).join(',')})`;

function set(label: string, fn: (l: Draft<Lighting>, p: Draft<Project>) => void) {
  useDocument.getState().mutate(
    label,
    (d) => {
      if (!d.lighting) d.lighting = { ...DEFAULT_LIGHTING };
      fn(d.lighting, d);
    },
    { mergeKey: `light-${label}` },
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  track,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  track?: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-fg-muted">{label}</span>
        <span className="tnum font-medium">{display}</span>
      </div>
      <Slider.Root
        className="relative flex h-5 touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v!)}
        aria-label={label}
        data-testid={testId}
      >
        <Slider.Track
          className="relative h-1.5 grow rounded-full bg-active"
          style={track ? { background: track } : undefined}
        >
          {!track && <Slider.Range className="absolute h-full rounded-full bg-accent" />}
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border border-line-strong bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={label}
        />
      </Slider.Root>
    </div>
  );
}

export function LightControls() {
  const project = useDocument((s) => s.project);
  const L = project.lighting ?? DEFAULT_LIGHTING;
  const { hour, month } = project.exterior.sun;
  const alt = sunPosition(project.site.latitude, month, hour).altitude;
  const autoK = Math.round(sunKelvin(alt) / 50) * 50;
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return (
    <div className="flex flex-col gap-3.5" data-testid="light-panel">
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">Sky</h3>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Sky">
          {[{ id: 'auto', name: 'Auto' } as const, ...SKIES].map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={L.sky === s.id}
              onClick={() => set('Sky', (l) => void (l.sky = s.id))}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[9px] p-1 text-[10.5px] font-medium',
                L.sky === s.id
                  ? 'bg-accent-soft text-accent ring-1 ring-accent'
                  : 'text-fg-muted hover:bg-hover',
              )}
            >
              <span
                className="h-9 w-full rounded-[6px] bg-cover bg-center ring-1 ring-inset ring-black/10"
                style={{
                  backgroundImage:
                    s.id === 'auto'
                      ? 'linear-gradient(135deg,#9fc3e6,#f0c08a 60%,#1c2238)'
                      : `url(/skies/${s.id}/bg.jpg)`,
                  backgroundPosition: s.id === 'auto' ? undefined : '60% 30%',
                  backgroundSize: s.id === 'auto' ? undefined : '400% 200%',
                }}
              />
              {s.name}
            </button>
          ))}
        </div>
      </section>
      <SliderRow
        label="Time of day"
        value={hour}
        min={0}
        max={24}
        step={0.25}
        display={`${h}:${String(m).padStart(2, '0')}`}
        onChange={(v) => set('Time of day', (_, p) => void (p.exterior.sun.hour = v))}
        testId="light-time"
      />
      <SliderRow
        label="Season"
        value={month}
        min={1}
        max={12}
        step={1}
        display={MONTHS[month - 1]!}
        onChange={(v) => set('Month', (_, p) => void (p.exterior.sun.month = v))}
      />

      <section className="flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
            Light temperature
          </h3>
          <label className="flex items-center gap-2 text-[12px] text-fg-muted">
            Follow sun
            <Switch
              label="Light temperature follows the sun"
              checked={L.temperatureAuto}
              onChange={(on) =>
                set(
                  'Temperature mode',
                  (l) => void ((l.temperatureAuto = on), on ? null : (l.temperature = autoK)),
                )
              }
            />
          </label>
        </div>
        <SliderRow
          label={L.temperatureAuto ? 'Daylight (automatic)' : 'Daylight'}
          value={L.temperatureAuto ? autoK : L.temperature}
          min={1800}
          max={11000}
          step={50}
          track={TEMP_GRADIENT}
          display={`${L.temperatureAuto ? autoK : L.temperature} K`}
          onChange={(v) =>
            set('Light temperature', (l) => void ((l.temperatureAuto = false), (l.temperature = v)))
          }
          testId="light-temperature"
        />
        <div className="flex justify-between text-[10.5px] text-fg-subtle">
          <span>Warm</span>
          <span>Neutral</span>
          <span>Cool</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-3">
        <SliderRow
          label="Sun strength"
          value={L.sunIntensity}
          min={0}
          max={3}
          step={0.05}
          display={`${Math.round(L.sunIntensity * 100)}%`}
          onChange={(v) => set('Sun strength', (l) => void (l.sunIntensity = v))}
        />
        <SliderRow
          label="Sky light"
          value={L.ambient}
          min={0}
          max={3}
          step={0.05}
          display={`${Math.round(L.ambient * 100)}%`}
          onChange={(v) => set('Sky light', (l) => void (l.ambient = v))}
        />
        <SliderRow
          label="Exposure"
          value={L.exposure}
          min={0.3}
          max={2.5}
          step={0.05}
          display={`${L.exposure.toFixed(2)}×`}
          onChange={(v) => set('Exposure', (l) => void (l.exposure = v))}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
            <Lamp className="h-3.5 w-3.5" /> Lamps
          </h3>
          <Switch
            label="Lamps on"
            checked={L.lamps}
            onChange={(on) => set('Lamps', (l) => void (l.lamps = on))}
          />
        </div>
        {L.lamps && (
          <>
            <SliderRow
              label="Bulb temperature"
              value={L.lampTemperature}
              min={1800}
              max={6500}
              step={50}
              track={`linear-gradient(90deg, ${[1800, 2400, 2700, 3000, 4000, 5000, 6500].map(kelvinToHex).join(',')})`}
              display={`${L.lampTemperature} K`}
              onChange={(v) => set('Bulb temperature', (l) => void (l.lampTemperature = v))}
              testId="lamp-temperature"
            />
            <SliderRow
              label="Brightness"
              value={L.lampIntensity}
              min={0}
              max={4}
              step={0.05}
              display={`${Math.round(L.lampIntensity * 100)}%`}
              onChange={(v) => set('Lamp brightness', (l) => void (l.lampIntensity = v))}
            />
          </>
        )}
      </section>
      <button
        className="self-start text-xs text-accent hover:underline"
        onClick={() =>
          set('Reset lighting', (l) => {
            Object.assign(l, { ...DEFAULT_LIGHTING });
          })
        }
      >
        Reset lighting
      </button>
    </div>
  );
}

export function LightButton({ side = 'top' }: { side?: 'top' | 'bottom' | 'left' }) {
  const readOnly = useDocument((s) => s.readOnly);
  return (
    <Popover.Root>
      <Tooltip label="Lighting" side={side}>
        <Popover.Trigger asChild>
          <button
            aria-label="Lighting"
            data-testid="open-lighting"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-fg-muted hover:bg-hover hover:text-fg [&_svg]:h-[18px] [&_svg]:w-[18px]"
          >
            <SunMedium />
          </button>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="panel animate-in z-50 max-h-[80vh] w-[300px] overflow-y-auto bg-panel-solid p-4 scrollbar-thin"
        >
          <fieldset disabled={readOnly} className="min-w-0">
            <LightControls />
          </fieldset>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
