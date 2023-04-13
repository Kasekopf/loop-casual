import {
  buy,
  cliExecute,
  Familiar,
  familiarWeight,
  getFuel,
  getWorkshed,
  haveEquipped,
  Item,
  itemAmount,
  Location,
  Monster,
  myAscensions,
  myFamiliar,
  myMeat,
  myTurncount,
  retrieveItem,
  Skill,
  toInt,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  AsdonMartin,
  Counter,
  get,
  getBanishedMonsters,
  getKramcoWandererChance,
  have,
  Macro,
  set,
  SourceTerminal,
} from "libram";
import {
  CombatResource as BaseCombatResource,
  DelayedMacro,
  OutfitSpec,
  step,
} from "grimoire-kolmafia";
import { atLevel } from "../lib";
import { Task } from "./task";
import { monstersAt } from "../tasks/absorb";
import { args } from "../args";

export interface Resource {
  name: string;
  available: () => boolean;
  prepare?: () => void;
  equip?: Item | Familiar | OutfitSpec | OutfitSpec[];
  chance?: () => number;
}

export type CombatResource = Resource & BaseCombatResource;

export interface BanishSource extends CombatResource {
  do: Item | Skill;
}

const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    available: () =>
      have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats") === 0,
    do: $skill`Bowl a Curveball`,
  },
  {
    name: "Asdon Martin",
    available: (): boolean => {
      if (args.debug.lastasdonbumperturn && myTurncount() - args.debug.lastasdonbumperturn > 30)
        return false;

      // From libram
      if (!asdonFualable(50)) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    prepare: () => asdonFillTo(50),
    do: $skill`Asdon Martin: Spring-Loaded Front Bumper`,
  },
  {
    name: "System Sweep",
    available: () => have($skill`System Sweep`),
    do: $skill`System Sweep`,
  },
  {
    name: "Latte",
    available: () =>
      (!get("_latteBanishUsed") || (get("_latteRefillsUsed") < 2 && myTurncount() < 1000)) && // Save one refill for aftercore
      have($item`latte lovers member's mug`),
    prepare: refillLatte,
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
  {
    name: "Monkey Paw",
    available: () => have($item`cursed monkey's paw`) && get("_monkeyPawWishesUsed", 0) === 0,
    equip: $item`cursed monkey's paw`,
    do: $skill`Monkey Slap`,
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
    const targets: Monster[] = [];
    targets.push(...(task.combat?.where("banish") ?? []));
    targets.push(...(task.combat?.where("ignoreSoftBanish") ?? []));
    if (
      (task.combat?.getDefaultAction() === "banish" ||
        task.combat?.getDefaultAction() === "ignoreSoftBanish") &&
      task.do instanceof Location
    ) {
      for (const monster of monstersAt(task.do)) {
        const strat = task.combat?.currentStrategy(monster);
        if (strat === "banish" || strat === "ignoreSoftBanish") {
          targets.push(monster);
        }
      }
    }
    return (
      targets.find(
        (monster) =>
          this.already_banished.has(monster) &&
          this.already_banished.get(monster) !== $item`ice house`
      ) !== undefined
    );
  }

  // Return true if all requested monsters in the task are banished
  isFullyBanished(task: Task): boolean {
    return (
      task.combat?.where("banish")?.find((monster) => !this.already_banished.has(monster)) ===
      undefined
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
  monsters: Monster[] | (() => Monster[]);
  chance: () => number;
  action?: DelayedMacro;
  possible: () => boolean; // If it is possible to encounter this on accident in the current character state.
}

export const wandererSources: WandererSource[] = [
  {
    name: "Digitize",
    available: () => SourceTerminal.have() && Counter.get("Digitize Monster") <= 0,
    equip: [
      { equip: $items`Space Trip safety headphones` },
      {
        equip: $items`unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      },
      {},
    ],
    monsters: () => [get("_sourceTerminalDigitizeMonster") ?? $monster`none`],
    chance: () => 1,
    action: () => {
      if (
        familiarWeight($familiar`Grey Goose`) <= 10 &&
        get("_sourceTerminalDigitizeMonster") === $monster`sausage goblin`
      )
        return new Macro().trySkill($skill`Emit Matter Duplicating Drones`);
      else return new Macro();
    },
    possible: () => SourceTerminal.have() && Counter.get("Digitize Monster") <= 5,
  },
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
    possible: () => haveEquipped($item`"I Voted!" sticker`),
  },
  {
    name: "Cursed Magnifying Glass",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("_voidFreeFights") < 5 &&
      get("cursedMagnifyingGlassCount") >= 13,
    equip: $item`cursed magnifying glass`,
    monsters: [$monster`void guy`, $monster`void slab`, $monster`void spider`],
    chance: () => 1, // when available
    possible: () => haveEquipped($item`cursed magnifying glass`),
  },
  {
    name: "Goth",
    available: () => have($familiar`Artistic Goth Kid`) && get("_hipsterAdv") < 7,
    equip: $familiar`Artistic Goth Kid`,
    monsters: [
      $monster`Black Crayon Beast`,
      $monster`Black Crayon Beetle`,
      $monster`Black Crayon Constellation`,
      $monster`Black Crayon Golem`,
      $monster`Black Crayon Demon`,
      $monster`Black Crayon Man`,
      $monster`Black Crayon Elemental`,
      $monster`Black Crayon Crimbo Elf`,
      $monster`Black Crayon Fish`,
      $monster`Black Crayon Goblin`,
      $monster`Black Crayon Hippy`,
      $monster`Black Crayon Hobo`,
      $monster`Black Crayon Shambling Monstrosity`,
      $monster`Black Crayon Manloid`,
      $monster`Black Crayon Mer-kin`,
      $monster`Black Crayon Frat Orc`,
      $monster`Black Crayon Penguin`,
      $monster`Black Crayon Pirate`,
      $monster`Black Crayon Flower`,
      $monster`Black Crayon Slime`,
      $monster`Black Crayon Undead Thing`,
      $monster`Black Crayon Spiraling Shape`,
    ],
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_hipsterAdv")],
    possible: () => myFamiliar() === $familiar`Artistic Goth Kid`,
  },
  {
    name: "Hipster",
    available: () => have($familiar`Mini-Hipster`) && get("_hipsterAdv") < 7,
    equip: $familiar`Mini-Hipster`,
    monsters: [
      $monster`angry bassist`,
      $monster`blue-haired girl`,
      $monster`evil ex-girlfriend`,
      $monster`peeved roommate`,
      $monster`random scenester`,
    ],
    chance: () => [0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0][get("_hipsterAdv")],
    possible: () => myFamiliar() === $familiar`Mini-Hipster`,
  },
  {
    name: "Kramco",
    available: () => have($item`Kramco Sausage-o-Matic™`) && atLevel(5),
    equip: [
      { equip: $items`Kramco Sausage-o-Matic™, Space Trip safety headphones` },
      {
        equip: $items`Kramco Sausage-o-Matic™, unwrapped knock-off retro superhero cape`,
        modes: { retrocape: ["heck", "hold"] },
      },
      { equip: $items`Kramco Sausage-o-Matic™` },
    ],
    prepare: () => {
      if (SourceTerminal.have() && SourceTerminal.getDigitizeUses() === 0) {
        SourceTerminal.prepareDigitize();
      }
    },
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
    action: () => {
      const result = new Macro();
      if (SourceTerminal.have() && SourceTerminal.getDigitizeUses() === 0)
        result.trySkill($skill`Digitize`);
      if (
        familiarWeight($familiar`Grey Goose`) <= 10 &&
        haveEquipped($item`Space Trip safety headphones`)
      )
        result.trySkill($skill`Emit Matter Duplicating Drones`);
      return result;
    },
    possible: () => haveEquipped($item`Kramco Sausage-o-Matic™`),
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
    name: "Latte (Refill)",
    available: () =>
      (!get("_latteBanishUsed") || get("_latteRefillsUsed") < 2) && // Save one refill for aftercore
      have($item`latte lovers member's mug`) &&
      shouldFinishLatte(),
    prepare: refillLatte,
    do: new Macro().skill($skill`Throw Latte on Opponent`),
    chance: () => 1,
    equip: $item`latte lovers member's mug`,
    banishes: true,
  },
  {
    name: "Bowl Curveball",
    available: () =>
      have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats") === 0,
    do: new Macro().skill($skill`Bowl a Curveball`),
    chance: () => 1,
    banishes: true,
  },
  {
    name: "Asdon Martin",
    available: (): boolean => {
      // From libram
      if (!asdonFualable(50)) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    prepare: () => asdonFillTo(50),
    do: new Macro().skill($skill`Asdon Martin: Spring-Loaded Front Bumper`),
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

export const freekillSources: FreekillSource[] = [
  {
    name: "Lil' Doctor™ bag",
    available: () => have($item`Lil' Doctor™ bag`) && get("_chestXRayUsed") < 3,
    do: $skill`Chest X-Ray`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Replica bat-oomerang",
    available: () => have($item`replica bat-oomerang`) && get("_usedReplicaBatoomerang") < 3,
    do: $item`replica bat-oomerang`,
  },
  {
    name: "The Jokester's gun",
    available: () => have($item`The Jokester's gun`) && !get("_firedJokestersGun"),
    do: $skill`Fire the Jokester's Gun`,
    equip: $item`The Jokester's gun`,
  },
  {
    name: "Asdon Martin: Missile Launcher",
    available: () => asdonFualable(100) && !get("_missileLauncherUsed"),
    prepare: () => asdonFillTo(100),
    do: $skill`Asdon Martin: Missile Launcher`,
  },
];

/**
 * Actually fuel the asdon to the required amount.
 */
export function asdonFillTo(amount: number): boolean {
  if (getWorkshed() !== $item`Asdon Martin keyfob`) return false;

  const remaining = amount - getFuel();
  const count = Math.ceil(remaining / 5) + 1; // 5 is minimum adv gain from loaf of soda bread, +1 buffer
  if (!have($item`bugbear bungguard`) || !have($item`bugbear beanie`)) {
    // Prepare enough wad of dough from all-purpose flower
    // We must do this ourselves since retrieveItem($item`loaf of soda bread`)
    // in libram will not consider all-purpose flower
    if (itemAmount($item`wad of dough`) < count) {
      buy($item`all-purpose flower`);
      use($item`all-purpose flower`);
    }
  }

  retrieveItem(count, $item`loaf of soda bread`);
  visitUrl(
    `campground.php?action=fuelconvertor&pwd&qty=${count}&iid=${toInt(
      $item`loaf of soda bread`
    )}&go=Convert%21`
  );
  if (getFuel() < amount) {
    throw new Error("Soda bread did not generate enough fuel");
  }
  return true;
}

/**
 * Return true if we can possibly fuel the asdon to the required amount.
 */
export function asdonFualable(amount: number): boolean {
  if (!AsdonMartin.installed()) return false;
  if (!have($item`forged identification documents`) && step("questL11Black") < 4) return false; // Save early
  if (amount <= getFuel()) return true;

  // Use wad of dough with the bugbear outfit
  if (have($item`bugbear bungguard`) && have($item`bugbear beanie`)) {
    return myMeat() >= (amount - getFuel()) * 24 + 1000; // Save 1k meat as buffer
  }

  // Use all-purpose flower if we have enough ascensions
  if (myAscensions() >= 10 && (have($item`bitchin' meatcar`) || have($item`Desert Bus pass`))) {
    return myMeat() >= 3000 + (amount - getFuel()) * 14; // 2k for all-purpose flower + save 1k meat as buffer + soda water
  }

  return false;
}

/**
 * Return true if we have all of our final latte ingredients, but they are not in the latte.
 */
export function shouldFinishLatte(): boolean {
  if (!have($item`latte lovers member's mug`)) return false;
  if (myTurncount() >= 1000) return false;

  // Check that we have all the proper ingredients
  for (const ingredient of ["wing", "cajun", "vitamins"])
    if (!get("latteUnlocks").includes(ingredient)) return false;
  // Check that the latte is not already finished
  return !["Meat Drop: 40", "Combat Rate: 10", "Experience (familiar): 3"].every((modifier) =>
    get("latteModifier").includes(modifier)
  );
}

/**
 * Refill the latte, using as many final ingredients as possible.
 */
export function refillLatte(): void {
  if (!get("_latteBanishUsed")) return;
  const modifiers = [];
  if (get("latteUnlocks").includes("wing")) modifiers.push("wing");
  if (get("latteUnlocks").includes("cajun")) modifiers.push("cajun");
  if (get("latteUnlocks").includes("vitamins")) modifiers.push("vitamins");
  modifiers.push("cinnamon", "pumpkin", "vanilla"); // Always unlocked
  cliExecute(`latte refill ${modifiers.slice(0, 3).join(" ")}`);
}

export type YellowRaySource = CombatResource;
export const yellowRaySources: YellowRaySource[] = [
  {
    name: "Jurassic Parka",
    available: () => have($skill`Torso Awareness`) && have($item`Jurassic Parka`),
    equip: { equip: $items`Jurassic Parka`, modes: { parka: "dilophosaur" } },
    do: $skill`Spit jurassic acid`,
  },
  {
    name: "Yellow Rocket",
    available: () => myMeat() >= 250 && have($item`Clan VIP Lounge key`),
    prepare: () => retrieveItem($item`yellow rocket`),
    do: $item`yellow rocket`,
  },
  {
    name: "Retro Superhero Cape",
    available: () => have($item`unwrapped knock-off retro superhero cape`),
    equip: {
      equip: $items`unwrapped knock-off retro superhero cape`,
      modes: { retrocape: ["heck", "kiss"] },
    },
    do: $skill`Unleash the Devil's Kiss`,
  },
];

export function yellowRayPossible(): boolean {
  if (have($effect`Everything Looks Yellow`)) return false;
  return yellowRaySources.find((s) => s.available()) !== undefined;
}

export type ForceItemSource = CombatResource;
export const forceItemSources: ForceItemSource[] = [
  {
    name: "Saber",
    available: () => have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5,
    prepare: () => set("choiceAdventure1387", 3),
    equip: $item`Fourth of May Cosplay Saber`,
    do: $skill`Use the Force`,
  },
];

export function forceItemPossible(): boolean {
  return yellowRayPossible() || forceItemSources.find((s) => s.available()) !== undefined;
}

export type ForceNCSorce = CombatResource & { do: Macro };
export const forceNCSources: ForceNCSorce[] = [
  {
    name: "Parka",
    available: () =>
      have($skill`Torso Awareness`) &&
      have($item`Jurassic Parka`) &&
      get("_spikolodonSpikeUses") + args.minor.saveparka < 5,
    equip: { equip: $items`Jurassic Parka`, modes: { parka: "spikolodon" } },
    do: Macro.skill($skill`Launch spikolodon spikes`),
  },
];

export function forceNCPossible(): boolean {
  return forceNCSources.find((s) => s.available()) !== undefined;
}
