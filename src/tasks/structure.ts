import { Effect, Familiar, Item, Location } from "kolmafia";
import { get } from "libram";
import { StringProperty } from "libram/dist/propertyTypes";
import { CombatStrategy } from "../combat";

export type Quest = {
  name: string;
  tasks: Task[];
};

export type AcquireItem = {
  item: Item;
  num?: number;
  price?: number;
  useful?: () => boolean;
  optional?: boolean;
};

export type Limit = {
  tries?: number;
  turns?: number;
  soft?: number;
  message?: string;
};

export interface OutfitSpec {
  equip?: Item[]; // Items to be equipped in any slot
  modifier?: string; // Modifier to maximize
  familiar?: Familiar; // Familiar to use
  avoid?: Item[]; // Items that cause issues and so should not be equipped
  skipDefaults?: boolean; // Do not equip default equipment; fully maximize
}

export type Task = {
  name: string;
  after: string[];
  ready?: () => boolean;
  priority?: () => boolean;
  prepare?: () => void;
  completed: () => boolean;
  do: Location | (() => void);
  post?: () => void;
  choices?: { [id: number]: number | (() => number) };
  combat?: CombatStrategy;
  outfit?: OutfitSpec | (() => OutfitSpec);
  effects?: Effect[];
  acquire?: AcquireItem[];
  delay?: number | (() => number);
  freeaction?: boolean;
  freecombat?: boolean;
  limit: Limit;
  noadventures?: boolean;
};

export function step(questName: StringProperty): number {
  const stringStep = get(questName);
  if (stringStep === "unstarted") return -1;
  else if (stringStep === "started") return 0;
  else if (stringStep === "finished") return 999;
  else {
    if (stringStep.substring(0, 4) !== "step") {
      throw "Quest state parsing error.";
    }
    return parseInt(stringStep.substring(4), 10);
  }
}
