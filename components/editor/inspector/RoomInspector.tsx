'use client';
import { Link2, Link2Off, ScanSearch } from 'lucide-react';
import { useState } from 'react';
import type { Level, Project, Room } from '@/core/model/schema';
import { Section, Row, More } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { TextField } from '@/components/ui/TextField';
import { IconButton, Button } from '@/components/ui/Button';
import { ModelNumber, mutate } from './fields';
import { EntityActions, Readout } from './common';
import * as ops from '@/core/model/ops';
import { findEntity } from '@/core/model/entities';
import { roomArea, roomPolygon } from '@/core/geometry/graph';
import { bounds, perimeter } from '@/core/geometry/polygon';
import { formatArea, formatLength } from '@/core/units/units';
import { useDocument } from '@/store/document';
import { deleteRoomWithWalls, selectAllInRoom, setRoomFloor } from '@/store/actions';
import { Switch } from '@/components/ui/Switch';
import { LabeledRow } from '@/components/ui/Section';
import { Grid2x2X, Trash2 } from 'lucide-react';

export function RoomInspector({ room, level }: { room: Room; level: Level }) {
  const u = useDocument((s) => s.project.settings.units);
  const [linked, setLinked] = useState(false);
  const poly = roomPolygon(level, room);
  const b = bounds(poly);
  const set = (fn: (r: Room) => void) => (d: Project) => {
    const ref = findEntity(d, room.id);
    if (ref?.kind === 'room') fn(ref.entity);
  };
  const resize = (d: Project, axis: 'x' | 'y', v: number) => {
    const before = axis === 'x' ? b.width : b.height;
    ops.resizeRoom(d, level.id, room.id, axis, v);
    if (linked && before > 0) {
      const other = axis === 'x' ? 'y' : 'x';
      ops.resizeRoom(d, level.id, room.id, other, (other === 'x' ? b.width : b.height) * (v / before));
    }
  };
  // Walls of the loop, for "paint all walls".
  const loopWalls = room.nodes
    .map((id, i) =>
      level.walls.find(
        (w) =>
          (w.a === id && w.b === room.nodes[(i + 1) % room.nodes.length]) ||
          (w.b === id && w.a === room.nodes[(i + 1) % room.nodes.length]),
      ),
    )
    .filter(Boolean);
  return (
    <>
      <Section title="Name">
        <TextField
          label="Room name"
          value={room.name}
          onChange={(v) => mutate('Rename room', (d) => set((r) => void (r.name = v))(d as Project))}
        />
      </Section>
      <Section
        title="Size"
        action={
          <IconButton
            label={linked ? 'Unlink proportions' : 'Keep proportions'}
            size="sm"
            active={linked}
            onClick={() => setLinked(!linked)}
          >
            {linked ? <Link2 /> : <Link2Off />}
          </IconButton>
        }
      >
        <Row>
          <ModelNumber
            label="Width"
            short="W"
            value={b.width}
            min={0.5}
            mergeKey={`room-w-${room.id}`}
            disabled={room.locked}
            testId="room-width"
            apply={(d, v) => resize(d as Project, 'x', v)}
          />
          <ModelNumber
            label="Length"
            short="L"
            value={b.height}
            min={0.5}
            mergeKey={`room-l-${room.id}`}
            disabled={room.locked}
            testId="room-length"
            apply={(d, v) => resize(d as Project, 'y', v)}
          />
        </Row>
        <Readout label="Floor area" value={formatArea(roomArea(level, room), u)} />
      </Section>
      <Section title="Floor">
        <LabeledRow label="Has a floor">
          <Switch
            label="Room has a floor"
            checked={room.floor !== false}
            onChange={(on) => setRoomFloor(room.id, on)}
          />
        </LabeledRow>
      </Section>
      <Section title="Finishes">
        <MaterialPicker
          label="Floor"
          category="floor"
          value={room.floorMaterial}
          onChange={(id) =>
            mutate('Floor finish', (d) => set((r) => void (r.floorMaterial = id))(d as Project))
          }
        />
        <MaterialPicker
          label="Ceiling"
          category="wall"
          value={room.ceilingMaterial}
          onChange={(id) =>
            mutate('Ceiling finish', (d) => set((r) => void (r.ceilingMaterial = id))(d as Project))
          }
        />
        <MaterialPicker
          label="Paint all walls"
          category="wall"
          value={loopWalls[0]?.materials.left ?? 'paint-white'}
          onChange={(id) =>
            mutate('Paint room', (d) => {
              const lvl = (d as Project).building.levels.find((l) => l.id === level.id)!;
              // Paint the face of each loop wall that faces into this room.
              const poly2 = roomPolygon(
                lvl,
                lvl.rooms.find((r) => r.id === room.id)!,
              );
              const ccw =
                poly2.reduce(
                  (s, p, i) =>
                    s + (p.x * poly2[(i + 1) % poly2.length]!.y - poly2[(i + 1) % poly2.length]!.x * p.y),
                  0,
                ) > 0;
              room.nodes.forEach((nid, i) => {
                const next = room.nodes[(i + 1) % room.nodes.length]!;
                const w = lvl.walls.find(
                  (x) => (x.a === nid && x.b === next) || (x.b === nid && x.a === next),
                );
                if (!w) return;
                const forward = w.a === nid;
                // For a CCW loop the interior is on the left of each edge.
                const left = forward === ccw;
                if (left) w.materials.left = id;
                else w.materials.right = id;
              });
            })
          }
        />
      </Section>
      <Section>
        <Button
          size="sm"
          variant="secondary"
          icon={<ScanSearch className="h-3.5 w-3.5" />}
          onClick={() => selectAllInRoom(room.id)}
        >
          Select everything in room
        </Button>
        <More>
          <Readout label="Perimeter" value={formatLength(perimeter(poly), u)} />
          <Readout label="Corners" value={String(room.nodes.length)} />
          <Readout
            label="Gross area"
            value={formatArea(Math.abs(b.width * b.height) > 0 ? polyArea(poly) : 0, u)}
          />
        </More>
      </Section>
      <EntityActions locked={room.locked} hideDelete />
      <Section>
        <div className="flex flex-wrap gap-1.5">
          {room.floor !== false && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Grid2x2X className="h-3.5 w-3.5" />}
              onClick={() => setRoomFloor(room.id, false)}
              data-testid="remove-floor"
            >
              Remove floor
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            disabled={room.locked}
            onClick={() => deleteRoomWithWalls(room.id)}
          >
            Delete room & walls
          </Button>
        </div>
        <p className="text-xs text-fg-subtle">To remove a single wall, click that wall and press Delete.</p>
      </Section>
    </>
  );
}

function polyArea(p: { x: number; y: number }[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++)
    a += p[i]!.x * p[(i + 1) % p.length]!.y - p[(i + 1) % p.length]!.x * p[i]!.y;
  return Math.abs(a / 2);
}
