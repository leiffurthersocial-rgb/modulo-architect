'use client';
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { usePrefs } from '@/store/prefs';
import { Dialog } from '@/components/ui/Dialog';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { NumberField } from '@/components/ui/NumberField';
import { Button } from '@/components/ui/Button';
import { applyTheme, readTheme, type ThemePref } from '@/lib/theme';
import { runCommand } from '@/features/commands/commands';
import { DEFAULTS } from '@/core/model/defaults';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="text-[13.5px]">{label}</div>
        {hint && <div className="text-xs text-fg-subtle">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-3 first:border-t-0">
      <h3 className="mb-1 text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">{title}</h3>
      {children}
    </section>
  );
}

const STEPS = ['auto', '0.05', '0.1', '0.25', '0.5', '1'] as const;

export function SettingsDialog() {
  const open = useEditor((s) => s.settingsOpen);
  const settings = useDocument((s) => s.project.settings);
  const readOnly = useDocument((s) => s.readOnly);
  const p = usePrefs();
  const [theme, setTheme] = useState<ThemePref>('system');
  useEffect(() => {
    if (open) setTheme(readTheme());
  }, [open]);
  const setProject = (label: string, fn: (s: typeof settings) => void) =>
    useDocument.getState().mutate(label, (d) => fn(d.settings));
  const units = settings.units;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => useEditor.getState().set({ settingsOpen: o })}
      title="Settings"
      description="Project settings travel with the file; preferences stay in this browser."
      className="w-[min(600px,calc(100vw-32px))]"
    >
      <div className="scrollbar-thin overflow-y-auto" data-testid="settings">
        <Group title="General">
          <Row label="Units" hint="Saved with the project">
            <Segmented
              ariaLabel="Units"
              size="sm"
              value={settings.units}
              onChange={(v) => setProject('Switch units', (s) => void (s.units = v))}
              options={[
                { value: 'metric', label: 'Metric (m)' },
                { value: 'imperial', label: 'Imperial (ft)' },
              ]}
            />
          </Row>
          <Row label="Theme">
            <Segmented<ThemePref>
              ariaLabel="Theme"
              size="sm"
              value={theme}
              onChange={(v) => {
                applyTheme(v);
                setTheme(v);
              }}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Row>
        </Group>

        <Group title="Drawing & snapping">
          <fieldset disabled={readOnly} className="min-w-0">
            <Row label="Snapping" hint="Hold Alt to bypass it temporarily">
              <Switch
                label="Snapping"
                checked={settings.snapping}
                onChange={(on) => setProject('Toggle snapping', (s) => void (s.snapping = on))}
              />
            </Row>
            <Row label="Snap step" hint="Auto picks 5 cm to 1 m by zoom level">
              <Segmented
                ariaLabel="Snap step"
                size="sm"
                value={String(p.snapStep) as (typeof STEPS)[number]}
                onChange={(v) => p.set({ snapStep: v === 'auto' ? 'auto' : Number(v) })}
                options={STEPS.map((s) => ({
                  value: s,
                  label:
                    s === 'auto'
                      ? 'Auto'
                      : units === 'metric'
                        ? `${Number(s) * 100 < 100 ? `${Math.round(Number(s) * 100)} cm` : '1 m'}`
                        : `${Math.round((Number(s) / 0.0254) * 10) / 10}"`,
                }))}
              />
            </Row>
            <Row label="Angle step">
              <Segmented
                ariaLabel="Angle step"
                size="sm"
                value={String(settings.angleStep)}
                onChange={(v) => setProject('Angle step', (s) => void (s.angleStep = Number(v)))}
                options={['5', '15', '30', '45', '90'].map((a) => ({ value: a, label: `${a}°` }))}
              />
            </Row>
            <Row label="New wall thickness">
              <div className="w-[130px]">
                <NumberField
                  label="New wall thickness"
                  short="T"
                  value={p.wallThickness}
                  units={units}
                  min={0.05}
                  max={1}
                  onChange={(v) => p.set({ wallThickness: v })}
                />
              </div>
            </Row>
          </fieldset>
        </Group>

        <Group title="Display">
          <Row label="Dimension labels" hint="Wall lengths in the plan">
            <Switch
              label="Dimension labels"
              checked={settings.showDimensions}
              onChange={(on) => setProject('Toggle dimensions', (s) => void (s.showDimensions = on))}
            />
          </Row>
          <Row label="Grid in 3D">
            <Switch label="Grid in 3D" checked={p.showGrid} onChange={(on) => p.set({ showGrid: on })} />
          </Row>
          <Row label="Shadows" hint="Turn off for speed on slower devices">
            <Switch label="Shadows" checked={p.shadows} onChange={(on) => p.set({ shadows: on })} />
          </Row>
        </Group>

        <Group title="Walk mode">
          <Row label="Eye height">
            <div className="w-[130px]">
              <NumberField
                label="Eye height"
                short="Eye"
                value={p.eyeHeight}
                units={units}
                min={0.6}
                max={2.2}
                onChange={(v) => p.set({ eyeHeight: v })}
              />
            </div>
          </Row>
          <Row label="Walking speed">
            <div className="w-[130px]">
              <NumberField
                label="Walking speed"
                short="×"
                kind="number"
                step={0.1}
                value={p.walkSpeed}
                units={units}
                min={0.3}
                max={3}
                onChange={(v) => p.set({ walkSpeed: Math.round(v * 10) / 10 })}
              />
            </div>
          </Row>
          <Row label="Look sensitivity">
            <div className="w-[130px]">
              <NumberField
                label="Look sensitivity"
                short="×"
                kind="number"
                step={0.1}
                value={p.lookSensitivity}
                units={units}
                min={0.2}
                max={3}
                onChange={(v) => p.set({ lookSensitivity: Math.round(v * 10) / 10 })}
              />
            </div>
          </Row>
          <Row label="Doors open as you approach">
            <Switch
              label="Automatic doors"
              checked={p.autoDoors}
              onChange={(on) => p.set({ autoDoors: on })}
            />
          </Row>
        </Group>

        <Group title="Help">
          <div className="flex flex-wrap gap-2 py-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => (
                useEditor.getState().set({ settingsOpen: false }),
                runCommand('help.shortcuts')
              )}
            >
              Keyboard shortcuts
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => (useEditor.getState().set({ settingsOpen: false }), runCommand('help.tour'))}
            >
              Show the tour again
            </Button>
            <Button size="sm" variant="ghost" onClick={() => p.reset()}>
              Reset preferences
            </Button>
          </div>
          <p className="pb-1 text-xs text-fg-subtle">
            Default new-wall thickness is {DEFAULTS.wallThickness * 100} cm (exterior) /{' '}
            {DEFAULTS.interiorWallThickness * 100} cm (interior).
          </p>
        </Group>
      </div>
    </Dialog>
  );
}
