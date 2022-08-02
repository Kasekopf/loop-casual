import { Monster, myMeat } from "kolmafia";
import { $effect, $item, have, Macro } from "libram";
import { CombatStrategy } from "../combat";
import { OverridePriority } from "../priority";
import { Task } from "./structure";

export function yellowray<T extends { combat: CombatStrategy }>(task: T, ...monsters: Monster[]): T & Pick<Task, "ready" | "acquire" | "priority" | "combat"> {
  return {
    ...task,
    ready: () => !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
    acquire: [{ item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) }],
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
    combat: (task.combat ?? new CombatStrategy()).macro(new Macro().item($item`yellow rocket`), ...monsters),
  };
}
