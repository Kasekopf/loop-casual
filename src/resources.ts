import { Familiar, Item, Monster, myLevel, Skill, totalTurnsPlayed } from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
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

export interface CombatResource extends Resource {
  do: Item | Skill | Macro;
}

export interface BanishSource extends CombatResource {
  do: Item | Skill;
}

export const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    available: () => false,
    do: $skill`Bowl a Curveball`,
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
      // Map strange banish tracking to our resources
      if (banished_with === $item`training scroll:  Snokebomb`)
        used_banishes.add($skill`Snokebomb`);
      if (banished_with === $item`tomayohawk-style reflex hammer`)
        used_banishes.add($skill`Reflex Hammer`);
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
    name: "Voted Legs",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myLevel() >= 10 &&
      have($item`mutant legs`),
    equip: $items`"I Voted!" sticker, mutant legs`,
    monster:
      "monsterid 2094 || monsterid 2095 || monsterid 2096 || monsterid 2097 || monsterid 2098",
    chance: () => 1, // when available
  },
  {
    name: "Voted Arm",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myLevel() >= 10 &&
      have($item`mutant arm`),
    equip: $items`"I Voted!" sticker, mutant arm`,
    monster:
      "monsterid 2094 || monsterid 2095 || monsterid 2096 || monsterid 2097 || monsterid 2098",
    chance: () => 1, // when available
  },
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
    available: () => have($familiar`Artistic Goth Kid`) && get("_hipsterAdv") < 7,
    equip: $familiar`Artistic Goth Kid`,
    monster: "monstername Black Crayon *",
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_hipsterAdv")],
  },
];

export function canChargeVoid(): boolean {
  return get("_voidFreeFights") < 5 && get("cursedMagnifyingGlassCount") < 13;
}

export interface RunawaySource extends CombatResource {
  do: Macro;
  banishes: boolean;
  chance: () => number;
}

export const runawayValue =
  have($item`Greatest American Pants`) || have($item`navel ring of navel gazing`)
    ? 0.8 * get("valueOfAdventure")
    : get("valueOfAdventure");

export const runawaySources: RunawaySource[] = [
  {
    name: "Bowl Curveball",
    available: () => false,
    do: new Macro().skill($skill`Bowl a Curveball`),
    chance: () => 1,
    banishes: true,
  },
];

export interface FreekillSource extends CombatResource {
  do: Item | Skill;
}

export const freekillSources: FreekillSource[] = [];
