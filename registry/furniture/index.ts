import type { ElementDef } from '../types';
import armchair from './armchair';
import bathroomSink from './bathroom-sink';
import bathtub from './bathtub';
import bedDouble from './bed-double';
import bedSingle from './bed-single';
import bench from './bench';
import bookshelf from './bookshelf';
import coffeeTable from './coffee-table';
import desk from './desk';
import diningChair from './dining-chair';
import diningTable from './dining-table';
import diningTableRound from './dining-table-round';
import dresser from './dresser';
import fireplace from './fireplace';
import floorLamp from './floor-lamp';
import fridge from './fridge';
import kitchenBase from './kitchen-base';
import kitchenIsland from './kitchen-island';
import kitchenWall from './kitchen-wall';
import nightstand from './nightstand';
import officeChair from './office-chair';
import ovenTall from './oven-tall';
import pendantLamp from './pendant-lamp';
import plant from './plant';
import rug from './rug';
import shower from './shower';
import sideTable from './side-table';
import sofa from './sofa';
import sofaCorner from './sofa-corner';
import tableLamp from './table-lamp';
import toilet from './toilet';
import tvUnit from './tv-unit';
import wardrobe from './wardrobe';
import washingMachine from './washing-machine';

/** Add a new furniture element: create a file in this folder and list it here. */
export const FURNITURE: ElementDef[] = [
  sofa,
  sofaCorner,
  armchair,
  coffeeTable,
  sideTable,
  tvUnit,
  bookshelf,
  fireplace,
  bedDouble,
  bedSingle,
  nightstand,
  wardrobe,
  dresser,
  diningTable,
  diningTableRound,
  diningChair,
  kitchenBase,
  kitchenWall,
  kitchenIsland,
  fridge,
  ovenTall,
  desk,
  officeChair,
  toilet,
  bathroomSink,
  bathtub,
  shower,
  washingMachine,
  floorLamp,
  tableLamp,
  pendantLamp,
  plant,
  rug,
  bench,
];
