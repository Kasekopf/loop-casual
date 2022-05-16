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
}

export type Task = {
  name: string;
  after: string[];
  ready?: () => boolean;
  priority?: () => OverridePriority;
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
  freeaction?: boolean | (() => boolean);
  freecombat?: boolean;
  limit: Limit;
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

/**
 * Temporary priorities that override the routing.
 */
export enum OverridePriority {
  LastCopyableMonster = 100, // Doing anything else will overwrite the last copyable monster.
  Effect = 20, // A useful effect for here was hard to get; it might expire.
  GoodOrb = 15, // There is a useful orb prediction here.
  YR = 10, // A yellow ray is available here.
  GoodGoose = 1, // The goose is charged and useful here.
  None = 0, // Default; nothing special.
  BadOrb = -2, // There is a useless orb prediction here.
  BadGoose = -16, // A charged goose would be useful here, but ours is not charged.
  BadMood = -100, // We have the wrong effects (+combat/-combat) for this.
}
