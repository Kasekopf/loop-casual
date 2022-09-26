import { cliExecute, equippedAmount, Familiar, Item, myBasestat, totalTurnsPlayed } from "kolmafia";
import { $familiar, $item, $stat, get, have } from "libram";
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

export function fixFoldables(outfit: Outfit) {
  // Libram outfit cache may not autofold umbrella, so we need to
  if (equippedAmount($item`unbreakable umbrella`) > 0) {
    if (outfit.modifier?.includes("-combat")) {
      if (get("umbrellaState") !== "cocoon") cliExecute("umbrella cocoon");
    } else if (
      (outfit.modifier?.includes("ML") ||
        outfit.modifier?.toLowerCase().includes("monster level percent")) &&
      !outfit.modifier.match("-[\\d .]*ML")
    ) {
      if (get("umbrellaState") !== "broken") cliExecute("umbrella broken");
    } else if (outfit.modifier?.includes("item")) {
      if (get("umbrellaState") !== "bucket style") cliExecute("umbrella bucket");
    } else {
      if (get("umbrellaState") !== "forward-facing") cliExecute("umbrella forward");
    }
  }

  // Libram outfit cache may not autofold camera, so we need to
  if (equippedAmount($item`backup camera`) > 0) {
    if (
      (outfit.modifier?.includes("ML") && !outfit.modifier.match("-[\\d .]*ML")) ||
      outfit.modifier?.includes("exp")
    ) {
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

  // Libram outfit cache may not autofold parka, so we need to
  // eslint-disable-next-line libram/verify-constants
  if (equippedAmount($item`Jurassic Parka`) > 0) {
    if (outfit.modifier?.includes("cold res")) {
      if (get("parkaMode").toLowerCase() !== "kachungasaur") cliExecute("parka kachungasaur");
    } else if (outfit.modifier?.includes("stench res")) {
      if (get("parkaMode").toLowerCase() !== "dilophosaur") cliExecute("parka dilophosaur");
    } else if (outfit.modifier?.includes("ML") && !outfit.modifier.match("-[\\d .]*ML")) {
      if (get("parkaMode").toLowerCase() !== "spikolodon") cliExecute("parka spikolodon");
    } else if (
      (outfit.modifier?.includes("init") && !outfit.modifier.match("-[\\d .]*init")) ||
      outfit.modifier?.includes("-combat")
    ) {
      if (get("parkaMode").toLowerCase() !== "pterodactyl") cliExecute("parka pterodactyl");
    } else {
      // +meat
      if (get("parkaMode").toLowerCase() !== "kachungasaur") cliExecute("parka kachungasaur");
    }
  }
}
