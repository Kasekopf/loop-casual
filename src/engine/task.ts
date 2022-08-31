import { Effect } from "kolmafia";
import { CombatActions, CombatStrategy } from "./combat";
import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";

export type Quest = BaseQuest<Task>;
export type Task = {
  priority?: () => boolean;
  combat?: CombatStrategy;
  effects?: Effect[];
  delay?: number | (() => number);
  freeaction?: boolean;
  freecombat?: boolean;
  limit: Limit;
  noadventures?: boolean;
  boss?: boolean;
} & BaseTask<CombatActions>;
