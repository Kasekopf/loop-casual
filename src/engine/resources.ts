import { cliExecute, Familiar, Item, itemAmount, Monster, Skill, totalTurnsPlayed } from "kolmafia";
import {
  $item,
  $monster,
  $skill,
  get,
  getBanishedMonsters,
  getKramcoWandererChance,
  have,
  Macro,
} from "libram";
import {
  CombatResource as BaseCombatResource
} from "grimoire-kolmafia";
import { atLevel } from "../lib";
import { Task } from "./task";

export interface Resource {
  name: string;
  available: () => boolean;
  prepare?: () => void;
  equip?: Item | Familiar | (Item | Familiar)[];
  chance?: () => number;
}

export type CombatResource = Resource & BaseCombatResource;

export interface BanishSource extends CombatResource {
  do: Item | Skill;
}

const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    available: () => have($item`cosmic bowling ball`),
    do: $skill`Bowl a Curveball`,
  },
  {
    name: "System Sweep",
    available: () => have($skill`System Sweep`),
    do: $skill`System Sweep`,
  },
  {
    name: "Latte",
    available: () =>
      (!get("_latteBanishUsed") || get("_latteRefillsUsed") < 2) && // Save one refil for aftercore
      have($item`latte lovers member's mug`),
    prepare: (): void => {
      if (get("_latteBanishUsed")) {
        const modifiers = [];
        if (get("latteUnlocks").includes("wing")) modifiers.push("wing");
        if (get("latteUnlocks").includes("cajun")) modifiers.push("cajun");
        modifiers.push("cinnamon", "pumpkin", "vanilla");
        cliExecute(`latte refill ${modifiers.slice(0, 3).join(" ")}`); // Always unlocked
      }
    },
    do: $skill`Throw Latte on Opponent`,
    equip: $item`latte lovers member's mug`,
  },
  {
    name: "Reflex Hammer",
    available: () => get("_reflexHammerUsed") < 3 && have($item`Lil' Doctor™ bag`),
    do: $skill`Reflex Hammer`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "KGB dart",
    available: () =>
      get("_kgbTranquilizerDartUses") < 3 && have($item`Kremlin's Greatest Briefcase`),
    do: $skill`KGB tranquilizer dart`,
    equip: $item`Kremlin's Greatest Briefcase`,
  },
  {
    name: "Middle Finger",
    available: () => !get("_mafiaMiddleFingerRingUsed") && have($item`mafia middle finger ring`),
    do: $skill`Show them your ring`,
    equip: $item`mafia middle finger ring`,
  },
];

export class BanishState {
  already_banished: Map<Monster, Item | Skill>;

  constructor() {
    this.already_banished = new Map(
      Array.from(getBanishedMonsters(), (entry) => [entry[1], entry[0]])
    );
  }

  // Return true if some of the monsters in the task are banished
  isPartiallyBanished(task: Task): boolean {
    return (
      task.combat
        ?.where("banish")
        ?.find(
          (monster) =>
            this.already_banished.has(monster) &&
            this.already_banished.get(monster) !== $item`ice house`
        ) !== undefined
    );
  }

  // Return true if all requested monsters in the task are banished
  isFullyBanished(task: Task): boolean {
    return (
      task.combat
        ?.where("banish")
        ?.find((monster) => !this.already_banished.has(monster)) === undefined
    );
  }

  // Return a list of all banishes not allocated to some available task
  unusedBanishes(tasks: Task[]): BanishSource[] {
    const used_banishes = new Set<Item | Skill>();
    for (const task of tasks) {
      if (task.combat === undefined) continue;
      for (const monster of task.combat.where("banish")) {
        const banished_with = this.already_banished.get(monster);
        if (banished_with !== undefined) used_banishes.add(banished_with);
      }
    }

    return banishSources.filter((banish) => banish.available() && !used_banishes.has(banish.do));
  }
}

export interface WandererSource extends Resource {
  monsters: Monster[];
  chance: () => number;
  action?: Macro;
}

export const wandererSources: WandererSource[] = [
  {
    name: "Voted",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      atLevel(5),
    equip: $item`"I Voted!" sticker`,
    monsters: [
      $monster`government bureaucrat`,
      $monster`terrible mutant`,
      $monster`angry ghost`,
      $monster`annoyed snake`,
      $monster`slime blob`,
    ],
    chance: () => 1, // when available
  },
  {
    name: "Cursed Magnifying Glass",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("_voidFreeFights") < 5 &&
      get("cursedMagnifyingGlassCount") >= 13 &&
      (itemAmount($item`barrel of gunpowder`) >= 5 || // Done with cmg + meteor trick
        get("sidequestLighthouseCompleted") !== "none"),
    equip: $item`cursed magnifying glass`,
    monsters: [$monster`void guy`, $monster`void slab`, $monster`void spider`],
    chance: () => 1, // when available
  },
  {
    name: "Kramco",
    available: () => have($item`Kramco Sausage-o-Matic™`) && atLevel(5),
    equip: $item`Kramco Sausage-o-Matic™`,
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
    action: new Macro().trySkill($skill`Emit Matter Duplicating Drones`),
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
  {
    name: "GAP",
    available: () => have($item`Greatest American Pants`),
    equip: $item`Greatest American Pants`,
    do: new Macro().runaway(),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
    banishes: false,
  },
  {
    name: "Navel Ring",
    available: () => have($item`navel ring of navel gazing`),
    equip: $item`navel ring of navel gazing`,
    do: new Macro().runaway(),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
    banishes: false,
  },
  {
    name: "Peppermint Parasol",
    available: () => have($item`peppermint parasol`),
    do: new Macro().item($item`peppermint parasol`),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
    banishes: false,
  },
];

export interface FreekillSource extends CombatResource {
  do: Item | Skill;
}

export const freekillSources: FreekillSource[] = [];
