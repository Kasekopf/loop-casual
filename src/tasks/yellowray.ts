import { Monster, myMeat } from "kolmafia";
import { $effect, $item, have, Macro } from "libram";
import { CombatStrategy } from "../engine/combat";
import { OverridePriority } from "../engine/priority";
import { Task } from "../engine/task";
import { OutfitSpec } from "grimoire-kolmafia";


export function yellowray<T extends Partial<Task>>(task: T, alternativeOutfit: OutfitSpec, monsters?: Monster | Monster[]): T & Pick<Task, "ready" | "acquire" | "priority" | "combat"> {
  return {
    ...task,
    ready: () => (task.ready?.() ?? true) && (have($effect`Everything Looks Yellow`) || myMeat() >= 250 || have($item`yellow rocket`)),
    acquire: () => {
      const acquire = typeof task.acquire === "function" ? task.acquire() : task.acquire ?? [];
      return [...acquire, { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) && have($item`Clan VIP Lounge key`) }]
    },
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.BadYR : (have($item`Clan VIP Lounge key`) ? OverridePriority.YR : OverridePriority.None),
    combat: (task.combat ?? new CombatStrategy()).macro(() => have($effect`Everything Looks Yellow`) ? new Macro() : Macro.tryItem($item`yellow rocket`), monsters),
    outfit: () => {
      const spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
      return have($effect`Everything Looks Yellow`) || !have($item`Clan VIP Lounge key`) ? alternativeOutfit : spec;
    },
  };
}
