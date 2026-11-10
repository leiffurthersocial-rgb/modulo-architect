'use client';
import type { Project } from '@/core/model/schema';
import { Section, Row } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { ModelNumber, mutate } from './fields';
import { useDocument } from '@/store/document';
import { bounds } from '@/core/geometry/polygon';
import { getEnvironment } from '@/registry/environments';

export function setPlotSize(d: Project, w: number, h: number) {
  const b = bounds(d.site.plot);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  d.site.plot = [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
}

export function SiteFields() {
  const site = useDocument((s) => s.project.site);
  const b = bounds(site.plot);
  return (
    <>
      <Row>
        <ModelNumber
          label="Plot width"
          short="W"
          value={b.width}
          min={5}
          max={500}
          mergeKey="plot-w"
          testId="plot-width"
          apply={(d, v) => setPlotSize(d as Project, v, b.height)}
        />
        <ModelNumber
          label="Plot depth"
          short="D"
          value={b.height}
          min={5}
          max={500}
          mergeKey="plot-d"
          apply={(d, v) => setPlotSize(d as Project, b.width, v)}
        />
      </Row>
      {site.terrainMaterial !== getEnvironment(site.environment).ground && (
        <button
          className="self-start text-xs text-accent hover:underline"
          onClick={() =>
            mutate(
              'Match surroundings',
              (d) => void (d.site.terrainMaterial = getEnvironment(d.site.environment).ground),
            )
          }
        >
          Match the surrounding ground
        </button>
      )}
      <MaterialPicker
        label="Terrain"
        category="terrain"
        value={site.terrainMaterial}
        onChange={(id) => mutate('Terrain', (d) => void (d.site.terrainMaterial = id))}
      />
      <Row>
        <ModelNumber
          label="North"
          kind="angle"
          value={site.northAngle}
          mergeKey="north"
          apply={(d, v) => void (d.site.northAngle = v)}
        />
        <ModelNumber
          label="Latitude"
          kind="number"
          value={site.latitude}
          min={-66}
          max={66}
          step={1}
          mergeKey="lat"
          apply={(d, v) => void (d.site.latitude = v)}
        />
      </Row>
    </>
  );
}

export function SiteInspector() {
  return (
    <Section title="Plot & terrain">
      <SiteFields />
    </Section>
  );
}
