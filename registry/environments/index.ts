import type { EnvironmentPreset } from './types';
import plain from './plain';
import countryside from './countryside';
import suburban from './suburban';
import cliffside from './cliffside';
import tropical from './tropical';
import alpine from './alpine';
import desert from './desert';
import lakeside from './lakeside';

export type { EnvironmentPreset } from './types';

/** Add a new outdoor setting: create a file in this folder and list it here. */
export const ENVIRONMENTS: EnvironmentPreset[] = [
  plain,
  countryside,
  suburban,
  cliffside,
  tropical,
  alpine,
  desert,
  lakeside,
];

export const getEnvironment = (id: string | undefined): EnvironmentPreset =>
  ENVIRONMENTS.find((e) => e.id === id) ?? plain;
