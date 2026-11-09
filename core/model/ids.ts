import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

const PREFIX = {
  node: 'n',
  wall: 'w',
  room: 'r',
  opening: 'o',
  stair: 's',
  item: 'i',
  level: 'l',
  roof: 'rf',
  project: 'p',
} as const;

export type IdKind = keyof typeof PREFIX;

export const createId = (kind: IdKind): string => `${PREFIX[kind]}_${nano()}`;
