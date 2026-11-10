import type { ElementDef } from '../types';
import hotTub from './hot-tub';
import bbq from './bbq';
import raisedBed from './raised-bed';
import firePit from './fire-pit';
import gardenBench from './garden-bench';
import lampPost from './lamp-post';
import mailbox from './mailbox';
import trampoline from './trampoline';
import gardenShed from './garden-shed';
import bicycle from './bicycle';
import palmTree from './palm-tree';
import gardenWall from './stone-wall';
import car from './car';
import conifer from './conifer';
import deck from './deck';
import driveway from './driveway';
import fence from './fence';
import hedge from './hedge';
import lounger from './lounger';
import outdoorShower from './outdoor-shower';
import parasol from './parasol';
import path from './path';
import pergola from './pergola';
import pool from './pool';
import shrub from './shrub';
import tree from './tree';

/** Add a new outdoor element: create a file in this folder and list it here. */
export const OUTDOOR: ElementDef[] = [
  fence,
  hedge,
  tree,
  conifer,
  shrub,
  path,
  driveway,
  deck,
  pool,
  outdoorShower,
  lounger,
  parasol,
  pergola,
  car,
  hotTub,
  bbq,
  raisedBed,
  firePit,
  gardenBench,
  lampPost,
  mailbox,
  trampoline,
  gardenShed,
  bicycle,
  palmTree,
  gardenWall,
];
