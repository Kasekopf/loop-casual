import { familiarWeight, myLevel, totalTurnsPlayed } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  ensureEffect,
  get,
  getBanishedMonsters,
  getKramcoWandererChance,
  have,
  Macro,
} from "libram";
import { debug } from "./lib";

export interface Resource {
  name: string;
  available: () => boolean;
  prepare?: () => void;
  equip?: Item | Familiar | (Item | Familiar)[];
  chance?: () => number;
}

export interface BanishSource extends Resource {
  do: Item | Skill;
}

export const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    available: () => have($item`cosmic bowling ball`),
    do: $skill`Bowl a Curveball`,
  },
  {
    name: "Feel Hatred",
    available: () => get("_feelHatredUsed") < 3 && have($skill`Emotionally Chipped`),
    do: $skill`Feel Hatred`,
  },
  {
    name: "Reflex Hammer",
    available: () => get("_reflexHammerUsed") < 3 && have($item`Lil' Doctor™ bag`),
    do: $skill`Reflex Hammer`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Snokebomb",
    available: () => get("_snokebombUsed") < 3 && have($skill`Snokebomb`),
    do: $skill`Snokebomb`,
  },
  {
    name: "KGB dart",
    available: () =>
      get("_kgbTranquilizerDartUses") < 3 && have($item`Kremlin's Greatest Briefcase`),
    do: $skill`KGB tranquilizer dart`,
    equip: $item`Kremlin's Greatest Briefcase`,
  },
  {
    name: "Latte",
    available: () => !get("_latteBanishUsed") && have($item`latte lovers member's mug`),
    do: $skill`Throw Latte on Opponent`,
    equip: $item`latte lovers member's mug`,
  },
  {
    name: "Middle Finger",
    available: () => !get("_mafiaMiddleFingerRingUsed") && have($item`mafia middle finger ring`),
    do: $skill`Show them your ring`,
    equip: $item`mafia middle finger ring`,
  },
  {
    name: "Louder Than Bomb",
    available: () => have($item`Louder Than Bomb`),
    do: $item`Louder Than Bomb`,
  },
  {
    name: "Crystal Skull",
    available: () => have($item`crystal skull`),
    do: $item`crystal skull`,
  },
];

export function unusedBanishes(to_banish: Monster[]): BanishSource[] {
  const used_banishes: Set<Item | Skill> = new Set<Item | Skill>();
  const already_banished = new Map(
    Array.from(getBanishedMonsters(), (entry) => [entry[1], entry[0]])
  );

  // Record monsters that still need to be banished, and the banishes used
  to_banish.forEach((monster) => {
    const banished_with = already_banished.get(monster);
    if (banished_with === undefined) {
      to_banish.push(monster);
    } else {
      used_banishes.add(banished_with);
    }
  });
  if (to_banish.length === 0) return []; // All monsters banished.

  debug(`Banish targets: ${to_banish.join(", ")}`);
  debug(`Banishes used: ${Array.from(used_banishes).join(", ")}`);
  return banishSources.filter((banish) => banish.available() && !used_banishes.has(banish.do));
}

export interface WandererSource extends Resource {
  monster: Monster | string;
  chance: () => number;
}

export const wandererSources: WandererSource[] = [
  {
    name: "Voted",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myLevel() >= 10,
    equip: $item`"I Voted!" sticker`,
    monster:
      "monsterid 2094 || monsterid 2095 || monsterid 2096 || monsterid 2097 || monsterid 2098",
    chance: () => 1, // when available
  },
  {
    name: "Cursed Magnifying Glass",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("_voidFreeFights") < 5 &&
      get("cursedMagnifyingGlassCount") >= 13,
    equip: $item`cursed magnifying glass`,
    monster: "monsterid 2227 || monsterid 2228 || monsterid 2229",
    chance: () => 1, // when available
  },
  {
    name: "Kramco",
    available: () => have($item`Kramco Sausage-o-Matic™`) && myLevel() >= 10,
    equip: $item`Kramco Sausage-o-Matic™`,
    monster: $monster`sausage goblin`,
    chance: () => getKramcoWandererChance(),
  },
  {
    name: "Goth",
    available: () => have($familiar`Artistic Goth Kid`) && get("_gothKidFights") < 7,
    equip: $familiar`Artistic Goth Kid`,
    monster: "monstername Black Crayon *",
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_gothKidFights")],
  },
];

export function canChargeVoid(): boolean {
  return get("_voidFreeFights") < 5 && get("cursedMagnifyingGlassCount") < 13;
}

export interface RunawaySource extends Resource {
  do: Macro;
  chance: () => number;
}

const banderGear = $items`Daylight Shavings Helmet, Buddy Bjorn, Stephen's lab coat, Greaves of the Murk Lord, hewn moon-rune spoon, astral pet sweater`;
const banderGearBonus = 45;
const banderEffects = 10;

export const runawaySources: RunawaySource[] = [
  {
    name: "Bandersnatch",
    available: () =>
      have($familiar`Frumious Bandersnatch`) &&
      familiarWeight($familiar`Frumious Bandersnatch`) + banderEffects + banderGearBonus + 5 <
        5 * get("_banderRunaways"),
    prepare: () => ensureEffect($effect`Ode to Booze`, 5),
    equip: [$familiar`Frumious Bandersnatch`, ...banderGear, $item`fish hatchet`],
    do: new Macro().runaway(),
    chance: () => 1,
  },
  {
    name: "Bandersnatch Offhand", // Use the potted plant as long as possible
    available: () =>
      have($familiar`Frumious Bandersnatch`) &&
      familiarWeight($familiar`Frumious Bandersnatch`) + banderEffects + banderGearBonus + 10 <
        5 * get("_banderRunaways"),
    prepare: () => ensureEffect($effect`Ode to Booze`, 5),
    equip: [$familiar`Frumious Bandersnatch`, ...banderGear, $item`iFlail`, $item`iFlail`],
    do: new Macro().runaway(),
    chance: () => 1,
  },
  {
    name: "GAP",
    available: () => have($item`Greatest American Pants`),
    equip: $item`Greatest American Pants`,
    do: new Macro().runaway(),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
  },
];
