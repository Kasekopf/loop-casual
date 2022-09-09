import { cliExecute, equippedAmount, familiarWeight, itemAmount, myBasestat } from "kolmafia";
import { $familiar, $item, $skill, $stat, get, getKramcoWandererChance, have } from "libram";
import { Resource } from "./resources";
import { Keys, keyStrategy } from "../tasks/keys";
import { towerSkip } from "../tasks/level13";
import { Outfit } from "grimoire-kolmafia";
import { haveLoathingLegion } from "../lib";

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

export function equipInitial(outfit: Outfit): void {
  if (outfit.modifier?.includes("item")) {
    outfit.equip($familiar`Grey Goose`);
    if (
      !outfit.modifier?.includes("+combat") &&
      !outfit.modifier?.includes(" combat") &&
      !outfit.modifier?.includes("res")
    )
      outfit.equip($item`protonic accelerator pack`);
  }
  // if (spec.modifier.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);
  if (outfit.modifier?.includes("meat")) {
    outfit.equip($familiar`Hobo Monkey`);
    outfit.equip($familiar`Leprechaun`); // backup
  }
  if (outfit.modifier?.includes("+combat") && !outfit.modifier?.includes("res"))
    outfit.equip($item`thermal blanket`);
}

export function equipCharging(outfit: Outfit): void {
  if (outfit.skipDefaults) return;

  if (
    familiarWeight($familiar`Grey Goose`) < 6 ||
    (familiarWeight($familiar`Grey Goose`) >= 6 &&
      [...outfit.equips.values()].includes($item`Kramco Sausage-o-Matic™`) &&
      getKramcoWandererChance() === 1)
  ) {
    if (outfit.equip($familiar`Grey Goose`)) {
      outfit.equip($item`yule hatchet`);
      outfit.equip($item`teacher's pen`);
      // Equip an offhand if it is not needed for the -combat umbrella
      if (!outfit.modifier?.includes("-combat") || have($skill`Phase Shift`) || !have($item`unbreakable umbrella`)) {
        outfit.equip($item`ghostly reins`);
        outfit.equip($item`familiar scrapbook`);
      }
    }
  } else if (
    (!have($item`eleven-foot pole`) ||
      !have($item`ring of Detect Boring Doors`) ||
      !have($item`Pick-O-Matic lockpicks`)) &&
    keyStrategy.useful(Keys.Dungeon) !== false &&
    !towerSkip()
  ) {
    outfit.equip($familiar`Gelatinous Cubeling`);
  } else if (get("camelSpit") < 100 && get("zeppelinProtestors") < 80) {
    outfit.equip($familiar`Melodramedary`);
  }
}

export function equipDefaults(outfit: Outfit): void {
  if (outfit.skipDefaults) return;

  if (outfit.modifier?.includes("-combat")) outfit.equip($familiar`Disgeist`); // low priority

  if (have($familiar`Temporal Riftlet`)) {
    outfit.equip($familiar`Temporal Riftlet`);
  } else if (have($item`gnomish housemaid's kgnee`)) {
    outfit.equip($familiar`Reagnimated Gnome`);
  } else outfit.equip($familiar`Galloping Grill`);
  outfit.equip($familiar`Melodramedary`);

  if (outfit.familiar === $familiar`Grey Goose` && familiarWeight($familiar`Grey Goose`) < 6)
    outfit.equip($item`grey down vest`);
  if (outfit.familiar === $familiar`Melodramedary` && get("camelSpit") < 100)
    outfit.equip($item`dromedary drinking helmet`);
  if (outfit.familiar === $familiar`Reagnimated Gnome`)
    outfit.equip($item`gnomish housemaid's kgnee`);

  outfit.equip($item`mafia thumb ring`);

  if (myBasestat($stat`moxie`) <= 200) {
    // Equip some extra equipment for early survivability
    outfit.equip($item`plastic vampire fangs`);
    outfit.equip($item`warbear goggles`);
    outfit.equip($item`burning paper slippers`);
  }

  if (!outfit.modifier) {
    // Default outfit
    outfit.equip($item`giant yellow hat`);
    outfit.equip($item`ice crown`);
    outfit.equip($item`June cleaver`);
    outfit.equip($item`industrial fire extinguisher`);
    if (have($skill`Torso Awareness`)) outfit.equip($item`fresh coat of paint`);
    outfit.equip($item`familiar scrapbook`);
    outfit.equip($item`protonic accelerator pack`);
    outfit.equip($item`unwrapped knock-off retro superhero cape`);
    outfit.equip($item`designer sweatpants`);
    outfit.equip($item`warbear long johns`);
    outfit.equip($item`square sponge pants`);
    outfit.equip($item`Cargo Cultist Shorts`);
    outfit.equip($item`lucky gold ring`);
    outfit.equip($item`Powerful Glove`);
    if (
      outfit.familiar === $familiar`Grey Goose` &&
      familiarWeight($familiar`Grey Goose`) < 6 &&
      itemAmount($item`teacher's pen`) >= 2
    )
      outfit.equip($item`teacher's pen`);
    outfit.equip($item`backup camera`);
    outfit.equip($item`birch battery`);
    outfit.equip($item`combat lover's locket`);
  } else {
    outfit.modifier += ", 0.01 MP regen, 0.001 HP regen";
    // Defibrillator breaks the Beaten up tests
    if (haveLoathingLegion()) {
      outfit.avoid.push($item`Loathing Legion defibrillator`);
    }

    // Do not use umbrella for -ML
    if (outfit.modifier.match("-[\\d .]*ML")) {
      outfit.avoid.push($item`unbreakable umbrella`);
    }

    // Avoid burning CMG void fight just for the modifier
    if (
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") >= 13 &&
      [...outfit.equips.values()].includes($item`cursed magnifying glass`)
    ) {
      outfit.avoid.push($item`cursed magnifying glass`);
    }
  }
  outfit.equip($item`miniature crystal ball`);
  // If we never found a better familiar, just keep charging the goose
  outfit.equip($familiar`Grey Goose`);
}

export function fixFoldables(outfit: Outfit) {
  // Libram outfit cache may not autofold umbrella, so we need to
  if (equippedAmount($item`unbreakable umbrella`) > 0) {
    if (outfit.modifier?.includes("-combat")) {
      if (get("umbrellaState") !== "cocoon") cliExecute("umbrella cocoon");
    } else if (outfit.modifier?.includes("ML")) {
      if (get("umbrellaState") !== "broken") cliExecute("umbrella broken");
    } else if (outfit.modifier?.includes("item")) {
      if (get("umbrellaState") !== "bucket style") cliExecute("umbrella bucket");
    } else {
      if (get("umbrellaState") !== "forward-facing") cliExecute("umbrella forward");
    }
  }

  // Libram outfit cache may not autofold camera, so we need to
  if (equippedAmount($item`backup camera`) > 0) {
    if (outfit.modifier?.includes("ML") && !outfit.modifier.match("-[\\d .]*ML")) {
      if (get("backupCameraMode").toLowerCase() !== "ml") cliExecute("backupcamera ml");
    } else if (outfit.modifier?.includes("init")) {
      if (get("backupCameraMode").toLowerCase() !== "init") cliExecute("backupcamera init");
    } else {
      if (get("backupCameraMode").toLowerCase() !== "meat") cliExecute("backupcamera meat");
    }
    if (!get("backupCameraReverserEnabled")) {
      cliExecute("backupcamera reverser on");
    }
  }

  // Libram outfit cache may not autofold cape, so we need to
  if (equippedAmount($item`unwrapped knock-off retro superhero cape`) > 0) {
    if (
      (outfit.modifier?.includes("res") && get("retroCapeSuperhero") !== "vampire") ||
      get("retroCapeWashingInstructions") !== "hold"
    ) {
      cliExecute("retrocape vampire hold");
    }
  }
}
