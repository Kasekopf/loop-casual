import {
  cliExecute,
  Effect,
  equip,
  outfit as equipOutfit,
  equippedAmount,
  equippedItem,
  familiarWeight,
  Item,
  itemAmount,
  weaponHands as mafiaWeaponHands,
  myBasestat,
  myMeat,
  myTurncount,
  outfitPieces,
  print,
  Skill,
  Slot,
  toSlot,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $familiars,
  $item,
  $skill,
  $slot,
  $slots,
  $stat,
  get,
  getKramcoWandererChance,
  have,
} from "libram";
import { Resource } from "./resources";
import { Keys, keyStrategy } from "../tasks/keys";
import { towerSkip } from "../tasks/level13";
import { Modes, Outfit, OutfitSpec, step } from "grimoire-kolmafia";
import { atLevel, haveLoathingLegion } from "../lib";
import { args } from "../args";

export function canEquipResource(outfit: Outfit, resource: Resource): boolean {
  if (!resource.equip) return true;
  if (Array.isArray(resource.equip))
    return resource.equip.find((spec) => outfit.canEquip(spec)) !== undefined;
  return outfit.canEquip(resource.equip);
}

export function equipFirst<T extends Resource>(outfit: Outfit, resources: T[]): T | undefined {
  for (const resource of resources) {
    if (!resource.available()) continue;
    if (resource.chance && resource.chance() === 0) continue;
    if (resource.equip) {
      // At least one of the provided equipment options must be equippable
      const specs = Array.isArray(resource.equip) ? resource.equip : [resource.equip];
      const chosen = specs.find((spec) => outfit.canEquip(spec) && outfit.equip(spec));
      if (chosen === undefined) continue;
    }
    return resource;
  }
  return undefined;
}

export function equipUntilCapped<T extends Resource>(outfit: Outfit, resources: T[]): T[] {
  const result: T[] = [];
  for (const resource of resources) {
    if (!resource.available()) continue;
    if (resource.chance && resource.chance() === 0) continue;
    if (resource.equip) {
      // At least one of the provided equipment options must be equippable
      const specs = Array.isArray(resource.equip) ? resource.equip : [resource.equip];
      const chosen = specs.find((spec) => outfit.canEquip(spec) && outfit.equip(spec));
      if (chosen === undefined) continue;
    }
    result.push(resource);
    if (resource.chance && resource.chance() === 1) break;
  }
  return result;
}

export function equipInitial(outfit: Outfit): void {
  const modifier = getModifiersFrom(outfit);

  if (modifier.includes("item")) {
    outfit.equip($familiar`Grey Goose`);
    if (!modifier.includes("+combat") && !modifier.includes(" combat") && !modifier.includes("res"))
      outfit.equip($item`protonic accelerator pack`);
  }
  // if (spec.modifier.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);
  if (modifier.includes("meat")) {
    if (get("_roboDrinks").toLowerCase().includes("drive-by shooting"))
      outfit.equip($familiar`Robortender`);
    outfit.equip($familiar`Hobo Monkey`);
    outfit.equip($familiar`Leprechaun`); // backup
  }
  if (modifier.includes("+combat") && !modifier.includes("res"))
    outfit.equip($item`thermal blanket`);

  if (args.minor.forcelocket) {
    outfit.equip($item`combat lover's locket`);
  }
}

export function equipCharging(outfit: Outfit, force_charge_goose: boolean): void {
  if (outfit.skipDefaults) return;

  const modifier = getModifiersFrom(outfit);

  // Try and get the Spooky Forest ghost first
  if (myTurncount() === 0 && get("nextParanormalActivity") === 1) {
    outfit.equip($item`protonic accelerator pack`);
  }

  if (
    familiarWeight($familiar`Grey Goose`) < 6 ||
    (familiarWeight($familiar`Grey Goose`) >= 6 &&
      [...outfit.equips.values()].includes($item`Kramco Sausage-o-Matic™`) &&
      getKramcoWandererChance() === 1) ||
    force_charge_goose
  ) {
    if (outfit.equip($familiar`Grey Goose`)) {
      outfit.equip($item`yule hatchet`);
      if (!atLevel(11)) outfit.equip($item`teacher's pen`);

      // Use latte mug for familiar exp
      if (
        !modifier.includes("-combat") &&
        have($item`latte lovers member's mug`) &&
        get("latteModifier").includes("Experience (familiar): 3")
      ) {
        outfit.equip($item`latte lovers member's mug`);
      }

      // Equip an offhand if it is not needed for the -combat umbrella
      if (
        !modifier.includes("-combat") ||
        have($skill`Photonic Shroud`) ||
        !have($item`unbreakable umbrella`)
      ) {
        outfit.equip($item`ghostly reins`);
        outfit.equip($item`familiar scrapbook`);
      }
    }
  }

  if (yellowSubmarinePossible() && itemAmount($item`yellow pixel`) < 50) {
    outfit.equip($familiar`Puck Man`);
    outfit.equip($familiar`Ms. Puck Man`);
    if (!modifier.includes("combat") && !modifier.includes("res")) {
      if (get("_yellowPixelDropsCrown") < 25 && outfit.equip($item`Buddy Bjorn`)) {
        outfit.bjornify($familiars`Puck Man, Ms. Puck Man`);
      }
    }
  }

  if (get("camelSpit") < 100 && get("hiddenBowlingAlleyProgress") < 7) {
    outfit.equip($familiar`Melodramedary`);
  }

  if (
    (!have($item`eleven-foot pole`) ||
      !have($item`ring of Detect Boring Doors`) ||
      !have($item`Pick-O-Matic lockpicks`)) &&
    keyStrategy.useful(Keys.Dungeon) !== false &&
    !towerSkip()
  ) {
    outfit.equip($familiar`Gelatinous Cubeling`);
  }
}

export function equipDefaults(outfit: Outfit, force_charge_goose: boolean): void {
  if (have($familiar`Temporal Riftlet`)) {
    outfit.equip($familiar`Temporal Riftlet`);
  }

  if (have($familiar`Reagnimated Gnome`) && outfit.equips.get($slot`familiar`) === undefined) {
    if (outfit.equip($familiar`Reagnimated Gnome`)) {
      outfit.equip($item`gnomish housemaid's kgnee`);
    }
  }

  if (
    outfit.familiar === $familiar`Grey Goose` &&
    (familiarWeight($familiar`Grey Goose`) < 6 || force_charge_goose)
  )
    outfit.equip($item`grey down vest`);
  if (outfit.familiar === $familiar`Melodramedary` && get("camelSpit") < 100)
    outfit.equip($item`dromedary drinking helmet`);

  if (outfit.skipDefaults) return;

  const modifier = getModifiersFrom(outfit);
  if (modifier.includes("-combat")) outfit.equip($familiar`Disgeist`); // low priority
  if (!modifier.includes("meat") || !have($item`backup camera`)) {
    // Leave room for backup camera for nuns
    outfit.equip($item`mafia thumb ring`);
  }
  if (atLevel(11)) outfit.equip($item`lucky gold ring`);

  if (myBasestat($stat`moxie`) <= 200) {
    // Equip some extra equipment for early survivability
    outfit.equip($item`plastic vampire fangs`);
    outfit.equip($item`warbear goggles`);
    outfit.equip($item`burning paper slippers`);
  }

  if (get("sweat") < 15) outfit.equip($item`designer sweatpants`);

  if (modifier.length === 0) {
    // Default outfit
    outfit.equip($item`giant yellow hat`);
    outfit.equip($item`ice crown`);
    outfit.equip($item`June cleaver`);
    outfit.equip($item`industrial fire extinguisher`);
    if (have($skill`Torso Awareness`)) {
      outfit.equip($item`Jurassic Parka`);
      outfit.equip($item`fresh coat of paint`);
    }
    outfit.equip($item`familiar scrapbook`);
    outfit.equip($item`protonic accelerator pack`);
    outfit.equip($item`unwrapped knock-off retro superhero cape`);
    outfit.equip($item`designer sweatpants`);
    outfit.equip($item`warbear long johns`);
    outfit.equip($item`square sponge pants`);
    outfit.equip($item`Cargo Cultist Shorts`);
    outfit.equip($item`lucky gold ring`);

    if (
      yellowSubmarinePossible() &&
      (itemAmount($item`red pixel`) < 5 ||
        itemAmount($item`blue pixel`) < 5 ||
        itemAmount($item`green pixel`) < 5)
    ) {
      outfit.equip($item`Powerful Glove`);
    }

    if (
      outfit.familiar === $familiar`Grey Goose` &&
      (familiarWeight($familiar`Grey Goose`) < 6 || force_charge_goose)
    )
      outfit.equip($item`teacher's pen`, $slot`acc3`);
    outfit.equip($item`backup camera`);
    outfit.equip($item`birch battery`);
    outfit.equip($item`combat lover's locket`);
    outfit.equip($item`Powerful Glove`);
  } else {
    outfit.modifier.push("0.01 MP regen, 0.001 HP regen");
    // Defibrillator breaks the Beaten up tests
    if (haveLoathingLegion()) {
      outfit.avoid.push($item`Loathing Legion defibrillator`);
    }
    if (modifier.includes("item") && outfit.equippedAmount($item`Kramco Sausage-o-Matic™`) === 0) {
      outfit.avoid.push($item`Kramco Sausage-o-Matic™`);
    }
  }

  // Avoid burning CMG void fight just for the modifier
  if (
    have($item`cursed magnifying glass`) &&
    get("cursedMagnifyingGlassCount") >= 13 &&
    ![...outfit.equips.values()].includes($item`cursed magnifying glass`)
  ) {
    outfit.avoid.push($item`cursed magnifying glass`);
  }

  outfit.equip($item`miniature crystal ball`);
  // If we never found a better familiar, just keep charging the goose
  outfit.equip($familiar`Grey Goose`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function yellowSubmarinePossible(assumePulls = false) {
  return false;
  // if (!have($item`Powerful Glove`)) return false;
  // if (!assumePulls && !have($item`Buddy Bjorn`)) return false;
  // if (!have($familiar`Puck Man`) && !have($familiar`Ms. Puck Man`)) return false;
  // if (
  //   have($item`dingy dinghy`) ||
  //   have($item`junk junk`) ||
  //   have($item`skeletal skiff`) ||
  //   have($item`yellow submarine`)
  // )
  //   return false;
  // return true;
}

export function fixFoldables(outfit: Outfit) {
  const modifier = getModifiersFrom(outfit);

  // Libram outfit cache may not autofold umbrella, so we need to
  if (equippedAmount($item`unbreakable umbrella`) > 0 && !outfit.modes["umbrella"]) {
    if (modifier.includes("-combat")) {
      if (get("umbrellaState") !== "cocoon") cliExecute("umbrella cocoon");
    } else if (modifier.includes("ML") && !modifier.match("-[\\d .]*ML")) {
      if (get("umbrellaState") !== "broken") cliExecute("umbrella broken");
    } else if (modifier.includes("item")) {
      if (get("umbrellaState") !== "bucket style") cliExecute("umbrella bucket");
    } else {
      if (get("umbrellaState") !== "forward-facing") cliExecute("umbrella forward");
    }
  }

  // Libram outfit cache may not autofold camera, so we need to
  if (equippedAmount($item`backup camera`) > 0 && !outfit.modes["backupcamera"]) {
    if (modifier.includes("ML") && !modifier.match("-[\\d .]*ML")) {
      if (get("backupCameraMode").toLowerCase() !== "ml") cliExecute("backupcamera ml");
    } else if (modifier.includes("init") && !modifier.match("-[\\d .]*init")) {
      if (get("backupCameraMode").toLowerCase() !== "init") cliExecute("backupcamera init");
    } else {
      if (get("backupCameraMode").toLowerCase() !== "meat") cliExecute("backupcamera meat");
    }
    if (!get("backupCameraReverserEnabled")) {
      cliExecute("backupcamera reverser on");
    }
  }

  // Libram outfit cache may not autofold cape, so we need to
  if (
    equippedAmount($item`unwrapped knock-off retro superhero cape`) > 0 &&
    !outfit.modes["retrocape"]
  ) {
    if (
      (modifier.includes("res") && get("retroCapeSuperhero") !== "vampire") ||
      get("retroCapeWashingInstructions") !== "hold"
    ) {
      cliExecute("retrocape vampire hold");
    }
  }

  // Libram outfit cache may not autofold parka, so we need to
  if (equippedAmount($item`Jurassic Parka`) > 0 && !outfit.modes["parka"]) {
    if (modifier.includes("cold res")) {
      if (get("parkaMode").toLowerCase() !== "kachungasaur") cliExecute("parka kachungasaur");
    } else if (modifier.includes("stench res")) {
      if (get("parkaMode").toLowerCase() !== "dilophosaur") cliExecute("parka dilophosaur");
    } else if (modifier.includes("ML") && !modifier.match("-[\\d .]*ML")) {
      if (get("parkaMode").toLowerCase() !== "spikolodon") cliExecute("parka spikolodon");
    } else if (
      modifier.includes("-combat") ||
      (modifier.includes("init") && !modifier.match("-[\\d .]*init") && !modifier.match("combat"))
    ) {
      if (get("parkaMode").toLowerCase() !== "pterodactyl") cliExecute("parka pterodactyl");
    } else {
      // +meat
      if (get("parkaMode").toLowerCase() !== "kachungasaur") cliExecute("parka kachungasaur");
    }
  }
}

const weaponHands = (i?: Item) => (i ? mafiaWeaponHands(i) : 0);

export function cacheDress(outfit: Outfit) {
  const currentEquipScore = cacheScore(outfit.equips);

  const outfits: { name: string; score: number }[] = [0, 1, 2, 3, 4, 5]
    .map((i) => `Script Outfit ${i}`)
    .map((name) => ({ name: name, score: cacheScore(outfit.equips, name) }));
  outfits.sort((a, b) => (a.score < b.score ? -1 : a.score > b.score ? 1 : 0)).reverse();
  if (outfits[0].score > currentEquipScore + 1) {
    const improvement = outfits[0].score - currentEquipScore;
    const name = outfits[0].name;
    const parts = outfitPieces(outfits[0].name).join(", ");
    print(`Equipping ${improvement} items with ${name} (${parts})`);
    equipOutfit(outfits[0].name);
  }

  if (
    outfit.equips.has($slot`off-hand`) &&
    !outfit.equips.has($slot`weapon`) &&
    weaponHands(equippedItem($slot`weapon`)) > 1
  ) {
    equip($item`none`, $slot`weapon`);
  }

  outfit.dress();
}

const nonAccSlots = $slots`hat, weapon, off-hand, back, shirt, pants`;
const accSlots = $slots`acc1, acc2, acc3`;
const outfitSlots = $slots`hat, weapon, off-hand, back, shirt, pants, acc1, acc2, acc3`;

export function loadItems(outfit?: string): Map<Slot, Item> {
  if (!outfit) {
    return new Map<Slot, Item>(outfitSlots.map((slot) => [slot, equippedItem(slot)]));
  }

  const result = new Map<Slot, Item>();
  const freeAccSlots = $slots`acc3, acc2, acc1`;
  const items = outfitPieces(outfit);
  for (const item of items) {
    const slot = toSlot(item);
    switch (slot) {
      case $slot`weapon`:
        // The second weapon in the item list is the dual-equipped one
        if (result.has($slot`weapon`)) result.set($slot`off-hand`, item);
        else result.set($slot`weapon`, item);
        break;
      case $slot`acc1`:
        result.set(freeAccSlots.pop() ?? $slot`none`, item);
        break;
      default:
        result.set(slot, item);
        break;
    }
  }
  return result;
}

export function cacheScore(desired: Map<Slot, Item>, name?: string): number {
  const items = loadItems(name);

  let overlap = 0;
  for (const slot of nonAccSlots) {
    if (desired.has(slot) && desired.get(slot) === items.get(slot)) overlap++;
  }

  const desiredAccesoriesMet = new Set<Slot>();
  for (const slot of accSlots) {
    const acc = items.get(slot);
    if (acc === undefined) continue;
    const matchedSlot = accSlots.find(
      (slot) => !desiredAccesoriesMet.has(slot) && desired.get(slot) === acc
    );
    if (matchedSlot !== undefined) {
      desiredAccesoriesMet.add(matchedSlot);
      overlap++;
    }
  }

  // print(`${name} (${[...items.values()].join(", ")}): ${overlap}`);
  return overlap;
}

type ResOption = {
  thing: Item | Skill | Effect;
  ready?: () => boolean;
  modes?: Partial<Modes>;
  value: number;
};

export class ElementalPlanner {
  options: ResOption[];
  constructor(options: ResOption[]) {
    this.options = options;
  }

  public maximumPossible(with_black_paint: boolean, avoid_slots: Slot[] = []) {
    let res = 0;
    if (
      with_black_paint &&
      (have($effect`Red Door Syndrome`) || (myMeat() >= 1000 && step("questL11Black") >= 2))
    )
      res += 2;
    for (const option of this.options) {
      if (option.thing instanceof Item && avoid_slots.includes(toSlot(option.thing))) continue;
      if (option.ready && !option.ready()) continue;
      if (have(option.thing)) res += option.value;
    }
    return res;
  }

  public outfitFor(goal: number, addTo?: OutfitSpec): Outfit {
    const result = new Outfit();
    if (addTo) result.equip(addTo);
    for (const option of this.options) {
      if (goal <= 0) break; // we equipped enough

      if (option.ready && !option.ready()) continue;
      if (option.thing instanceof Skill || option.thing instanceof Effect) {
        if (have(option.thing)) goal -= option.value;
      } else {
        if (result.equip(option.thing)) {
          if (option.modes) result.setModes(option.modes);
          goal -= option.value;
        }
      }
    }
    return result;
  }
}

export const coldPlanner = new ElementalPlanner([
  { thing: $effect`Hot Soupy Garbage`, value: 2 },
  { thing: $effect`Double Hot Soupy Garbage`, value: 2 },
  { thing: $skill`Nanofur`, value: 3 },
  { thing: $skill`Microweave`, value: 2 },
  { thing: $item`ice crown`, value: 3 },
  { thing: $item`ghost of a necklace`, value: 1 },
  {
    thing: $item`unwrapped knock-off retro superhero cape`,
    value: 3,
    modes: { retrocape: ["vampire", "hold"] },
  },
  {
    thing: $item`Jurassic Parka`,
    value: 3,
    ready: () => have($skill`Torso Awareness`),
    modes: { parka: "kachungasaur" },
  },
]);

export const stenchPlanner = new ElementalPlanner([
  { thing: $effect`Shivering Spine`, value: 2 },
  { thing: $effect`Doubly Shivering Spine`, value: 4 },
  { thing: $skill`Conifer Polymers`, value: 3 },
  { thing: $skill`Clammy Microcilia`, value: 2 },
  { thing: $item`ice crown`, value: 3 },
  { thing: $item`ghost of a necklace`, value: 1 },
  {
    thing: $item`unwrapped knock-off retro superhero cape`,
    value: 3,
    modes: { retrocape: ["vampire", "hold"] },
  },
  {
    thing: $item`Jurassic Parka`,
    value: 3,
    ready: () => have($skill`Torso Awareness`),
    modes: { parka: "dilophosaur" },
  },
]);

export function getModifiersFrom(outfit: OutfitSpec | Outfit | undefined): string {
  if (!outfit?.modifier) return "";
  if (Array.isArray(outfit.modifier)) return outfit.modifier.join(",");
  return outfit.modifier;
}
