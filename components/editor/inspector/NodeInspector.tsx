'use client';
import type { Level, Node, Project } from '@/core/model/schema';
import { Section, Row } from '@/components/ui/Section';
import { ModelNumber } from './fields';
import { EntityActions } from './common';
import * as ops from '@/core/model/ops';

export function NodeInspector({ node, level }: { node: Node; level: Level }) {
  return (
    <>
      <Section title="Corner position">
        <Row>
          <ModelNumber label="X" value={node.x} mergeKey={`nx-${node.id}`} apply={(d, v) => ops.moveNode(d as Project, level.id, node.id, { x: v, y: node.y })} />
          <ModelNumber label="Y" value={node.y} mergeKey={`ny-${node.id}`} apply={(d, v) => ops.moveNode(d as Project, level.id, node.id, { x: node.x, y: v })} />
        </Row>
      </Section>
      <EntityActions />
    </>
  );
}
