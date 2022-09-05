import { Item, Monster } from "kolmafia";
import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";
import { CombatActions, CombatStrategy } from "./combat";
import { OverridePriority } from "./priority";

export type AcquireItem = {
  item: Item;
  num?: number;
  price?: number;
  useful?: () => boolean;
  optional?: boolean;
};

export type Quest = BaseQuest<Task>;

export type Task = {
  priority?: () => OverridePriority;
  combat?: CombatStrategy;
  delay?: number | (() => number);
  freeaction?: boolean | (() => boolean);
  freecombat?: boolean;
  limit: Limit;
  expectbeatenup?: boolean;

  // The monsters to search for with orb.
  // In addition, absorb targets are always searched with the orb.
  // If not given, monsters to search for are based on the CombatStrategy.
  // If given but function returns undefined, do not use orb predictions.
  orbtargets?: () => Monster[] | undefined;
  boss?: boolean;
} & BaseTask<CombatActions>;
