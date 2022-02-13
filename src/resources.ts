import {
  bjornifyFamiliar,
  buy,
  cliExecute,
  Familiar,
  familiarWeight,
  floor,
  Item,
  mallPrice,
  Monster,
  myLevel,
  myTurncount,
  Skill,
  totalTurnsPlayed,
  use,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  AsdonMartin,
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
    name: "Asdon Martin",
    available: (): boolean => {
      // From libram
      if (!AsdonMartin.installed()) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    prepare: () => AsdonMartin.fillTo(50),
    do: $skill`Asdon Martin: Spring-Loaded Front Bumper`,
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
    available: () =>
      (!get("_latteBanishUsed") || get("_latteRefillsUsed") < 2) && // Save one refil for aftercore
      have($item`latte lovers member's mug`),
    prepare: (): void => {
      if (get("_latteBanishUsed")) cliExecute("latte refill cinnamon pumpkin vanilla"); // Always unlocked
    },
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

export interface RunawaySource extends Resource {
  do: Macro;
  chance: () => number;
}

// Gear and familiar to use for runaways (i.e., Bandersnatch or Stomping Boots)
const familiarGear = $items`Daylight Shavings Helmet, Buddy Bjorn, Stephen's lab coat, Greaves of the Murk Lord, hewn moon-rune spoon, astral pet sweater`;
const familiarGearBonus = 35;
const familiarEffectBonus = 15;
const runawayFamiliar = have($familiar`Frumious Bandersnatch`)
  ? $familiar`Frumious Bandersnatch`
  : have($familiar`Pair of Stomping Boots`)
  ? $familiar`Pair of Stomping Boots`
  : $familiar`none`;

function availableFamiliarRunaways(otherBonus: number) {
  if (runawayFamiliar === $familiar`none`) return 0;
  return floor(
    (familiarWeight(runawayFamiliar) +
      familiarEffectBonus +
      familiarGearBonus +
      otherBonus +
      (have($effect`Open Heart Surgery`) ? 10 : 0)) /
      5
  );
}

export const runawayValue = 0.8 * get("valueOfAdventure");

export const runawaySources: RunawaySource[] = [
  {
    name: "Bowl Curveball",
    available: () => have($item`cosmic bowling ball`),
    do: new Macro().skill($skill`Bowl a Curveball`),
    chance: () => 1,
  },
  {
    name: "Asdon Martin",
    available: (): boolean => {
      // From libram
      if (!AsdonMartin.installed()) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    prepare: () => AsdonMartin.fillTo(50),
    do: new Macro().skill($skill`Asdon Martin: Spring-Loaded Front Bumper`),
    chance: () => 1,
  },
  {
    name: "Familiar Runaways",
    available: () =>
      runawayFamiliar !== $familiar`none` &&
      have(runawayFamiliar) &&
      availableFamiliarRunaways(5) > get("_banderRunaways"), // 5 from fish hatchet
    prepare: (): void => {
      bjornifyFamiliar($familiar`Gelatinous Cubeling`);
      if (
        floor((familiarWeight(runawayFamiliar) + weightAdjustment()) / 5) <= get("_banderRunaways")
      ) {
        throw `Trying to use Bandersnatch or Stomping Boots, but weight was overestimated.`;
      }
      if (runawayFamiliar === $familiar`Frumious Bandersnatch`) {
        ensureEffect($effect`Ode to Booze`, 5);
      }
    },
    equip: [runawayFamiliar, ...familiarGear, $item`fish hatchet`],
    do: new Macro().runaway(),
    chance: () => 1,
  },
  {
    name: "Familiar Runaways (with offhand)", // Use the potted plant as long as possible
    available: () =>
      runawayFamiliar !== $familiar`none` &&
      have(runawayFamiliar) &&
      availableFamiliarRunaways(10) > get("_banderRunaways"), // 10 from iFlails
    prepare: (): void => {
      bjornifyFamiliar($familiar`Gelatinous Cubeling`);
      if (
        floor((familiarWeight(runawayFamiliar) + weightAdjustment()) / 5) <= get("_banderRunaways")
      ) {
        throw `Trying to use last Bandersnatch or Stomping Boots, but weight was overestimated.`;
      }
      if (runawayFamiliar === $familiar`Frumious Bandersnatch`) {
        ensureEffect($effect`Ode to Booze`, 5);
      }
    },
    equip: [runawayFamiliar, ...familiarGear, $item`iFlail`, $item`iFlail`],
    do: new Macro().runaway(),
    chance: () => 1,
  },
  {
    name: "Blank-Out",
    prepare: (): void => {
      if (!have($item`glob of Blank-Out`)) {
        if (!have($item`bottle of Blank-Out`)) {
          buy(1, $item`bottle of Blank-Out`, 5 * runawayValue);
        }
        use($item`bottle of Blank-Out`);
      }
    },
    available: () =>
      have($item`glob of Blank-Out`) ||
      (mallPrice($item`bottle of Blank-Out`) < 5 * runawayValue && !get("_blankoutUsed")),
    do: new Macro().tryItem($item`glob of Blank-Out`),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
  },
  {
    name: "GAP",
    available: () => have($item`Greatest American Pants`),
    equip: $item`Greatest American Pants`,
    do: new Macro().runaway(),
    chance: () => (get("_navelRunaways") < 3 ? 1 : 0.2),
  },
];

export interface FreekillSource extends Resource {
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
    name: "Gingerbread Mob Hit",
    available: () => have($skill`Gingerbread Mob Hit`) && !get("_gingerbreadMobHitUsed"),
    do: $skill`Gingerbread Mob Hit`,
  },
  {
    name: "Shattering Punch",
    available: () => have($skill`Shattering Punch`) && get("_shatteringPunchUsed") < 3,
    do: $skill`Shattering Punch`,
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
    available: () => AsdonMartin.installed() && !get("_missileLauncherUsed"),
    prepare: () => AsdonMartin.fillTo(100),
    do: $skill`Asdon Martin: Missile Launcher`,
  },
];
