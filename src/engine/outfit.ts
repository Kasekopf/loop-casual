import { Familiar, Item, myBasestat, totalTurnsPlayed } from "kolmafia";
import { $familiar, $item, $stat, get, have } from "libram";
import { Task } from "./task";
import { Resource } from "./resources";
import { Outfit } from "grimoire-kolmafia";

export function equipFirst<T extends Resource>(outfit: Outfit, resources: T[]): T | undefined {
  for (const resource of resources) {
    if (!resource.available()) continue;
    if (resource.chance && resource.chance() === 0) continue;
    if (!outfit.canEquip(resource.equip ?? [])) continue;
    if (!outfit.equip(resource.equip ?? [])) continue;
    return resource;
  }
  return undefined;
}

export function equipUntilCapped<T extends Resource>(outfit: Outfit, resources: T[]): T[] {
  const result: T[] = [];
  for (const resource of resources) {
    if (!resource.available()) continue;
    if (resource.chance && resource.chance() === 0) continue;
    if (!outfit.canEquip(resource.equip ?? [])) continue;
    if (!outfit.equip(resource.equip ?? [])) continue;
    result.push(resource);
    if (resource.chance && resource.chance() === 1) break;
  }
  return result;
}

export function createOutfit(task: Task): Outfit {
  const spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
  const outfit = new Outfit();
  for (const item of spec?.equip ?? []) outfit.equip(item);
  if (spec?.familiar) outfit.equip(spec.familiar);
  outfit.avoid = spec?.avoid;
  outfit.skipDefaults = spec?.skipDefaults ?? false;
  return outfit;
}

export function equipInitial(outfit: Outfit) {
  if (outfit.modifier) {
    // Run maximizer
    if (outfit.modifier.includes("item")) {
      if (
        outfit.canEquip($item`li'l ninja costume`) &&
        outfit.canEquip($familiar`Trick-or-Treating Tot`)
      ) {
        outfit.equip($item`li'l ninja costume`);
        outfit.equip($familiar`Trick-or-Treating Tot`);
      } else {
        outfit.equip($familiar`Jumpsuited Hound Dog`);
      }
    }
    if (outfit.modifier.includes("meat")) outfit.equip($familiar`Hobo Monkey`);
    if (outfit.modifier.includes("init")) outfit.equip($familiar`Oily Woim`);
  }
}

export function equipDefaults(outfit: Outfit): void {
  if (myBasestat($stat`muscle`) >= 40) outfit.equip($item`mafia thumb ring`);
  outfit.equip($item`lucky gold ring`);

  // low priority familiars for combat frequency
  if (outfit.modifier?.includes("-combat")) outfit.equip($familiar`Disgeist`);
  if (outfit.modifier?.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);

  if (!outfit.modifier) {
    // Default outfit
    outfit.equip($item`Fourth of May Cosplay Saber`);
    if (totalTurnsPlayed() >= get("nextParanormalActivity") && get("questPAGhost") === "unstarted")
      outfit.equip($item`protonic accelerator pack`);
    outfit.equip($item`vampyric cloake`);
    if (myBasestat($stat`mysticality`) >= 25) outfit.equip($item`Mr. Cheeng's spectacles`);
  }

  if (get("camelSpit") < 100 && get("cyrptNookEvilness") > 25) {
    outfit.equip($familiar`Melodramedary`);
  } else if (have($familiar`Temporal Riftlet`)) {
    outfit.equip($familiar`Temporal Riftlet`);
  } else if (have($item`gnomish housemaid's kgnee`)) {
    outfit.equip($familiar`Reagnimated Gnome`);
  } else outfit.equip($familiar`Galloping Grill`);

  const commonFamiliarEquips = new Map<Familiar, Item>([
    [$familiar`Melodramedary`, $item`dromedary drinking helmet`],
    [$familiar`Reagnimated Gnome`, $item`gnomish housemaid's kgnee`],
  ]);
  const familiarEquip = commonFamiliarEquips.get(outfit.familiar ?? $familiar`none`);
  if (familiarEquip && outfit.canEquip(familiarEquip)) outfit.equip(familiarEquip);
}
