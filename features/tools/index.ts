import type { ToolId } from '@/store/editor';
import type { Tool } from './types';
import { selectTool } from './select';
import { wallTool } from './wall';
import { roomTool } from './room';
import { openingTool } from './opening';
import { stairTool } from './stair';
import { placeTool } from './place';
import { measureTool } from './measure';
import { floorTool } from './floor';

const panTool: Tool = { id: 'pan', hint: () => 'Drag to pan the view' };

export const TOOLS: Record<ToolId, Tool> = {
  select: selectTool,
  wall: wallTool,
  room: roomTool,
  floor: floorTool,
  opening: openingTool,
  stair: stairTool,
  place: placeTool,
  measure: measureTool,
  pan: panTool,
};

export const getTool = (id: ToolId): Tool => TOOLS[id];
