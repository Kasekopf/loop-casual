import { Monster, myMeat } from "kolmafia";
import { $effect, $item, have, Macro } from "libram";
import { CombatStrategy } from "../combat";
import { OverridePriority } from "../priority";
import { GameState } from "../state";
import { OutfitSpec, Task } from "./structure";


export function yellowray<T extends Partial<Task>>(task: T, alternativeOutfit: OutfitSpec, ...monsters: Monster[]): T & Pick<Task, "ready" | "acquire" | "priority" | "combat"> {
  return {
    ...task,
    ready: (state: GameState) => (task.ready?.(state) ?? true) && (have($effect`Everything Looks Yellow`) || myMeat() >= 250 || have($item`yellow rocket`)),
    acquire: [{ item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) }],
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.BadYR : OverridePriority.YR,
    combat: (task.combat ?? new CombatStrategy()).macro(() => have($effect`Everything Looks Yellow`) ? new Macro() : Macro.item($item`yellow rocket`), ...monsters),
    outfit: (state: GameState) => {
      const spec = typeof task.outfit === "function" ? task.outfit(state) : task.outfit;
      return have($effect`Everything Looks Yellow`) ? alternativeOutfit : spec;
    },
  };
}
