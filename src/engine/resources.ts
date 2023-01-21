import { OutfitSpec } from "grimoire-kolmafia";
import {
  bjornifyFamiliar,
  buy,
  cliExecute,
  Familiar,
  familiarWeight,
  floor,
  Item,
  itemAmount,
  mallPrice,
  Monster,
  myLevel,
  myTurncount,
  retrieveItem,
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
  getModifier,
  have,
  Macro,
  sum,
} from "libram";
import { debug } from "../lib";

export interface Resource {
  name: string;
  available: () => boolean;
  prepare?: () => void;
  equip?: Item | Familiar | Item[] | OutfitSpec;
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
  // If needed, use banishers from the mall
  {
    name: "Louder Than Bomb",
    prepare: () => {
      retrieveItem($item`Louder Than Bomb`);
    },
    available: () => true,
    do: $item`Louder Than Bomb`,
  },
  {
    name: "Tennis Ball",
    prepare: () => {
      retrieveItem($item`tennis ball`);
    },
    available: () => true,
    do: $item`tennis ball`,
  },
  {
    name: "Divine Champagne Popper",
    prepare: () => {
      retrieveItem($item`divine champagne popper`);
    },
    available: () => true,
    do: $item`divine champagne popper`,
  },
  // Turn-taking banishes: lowest priority
  {
    name: "Crystal Skull",
    prepare: () => {
      retrieveItem($item`crystal skull`);
    },
    available: () => true,
    do: $item`crystal skull`,
  },
];

export function unusedBanishes(to_banish: Monster[]): BanishSource[] {
  const used_banishes: Set<Item | Skill> = new Set<Item | Skill>();
  const already_banished = new Map(
    Array.from(getBanishedMonsters(), (entry) => [entry[1], entry[0]])
  );

  // Record monsters that still need to be banished, and the banishes used
  const not_yet_banished: Monster[] = [];
  to_banish.forEach((monster) => {
    const banished_with = already_banished.get(monster);
    if (banished_with === undefined) {
      not_yet_banished.push(monster);
    } else {
      used_banishes.add(banished_with);
      // Map strange banish tracking to our resources
      if (banished_with === $item`training scroll:  Snokebomb`)
        used_banishes.add($skill`Snokebomb`);
      if (banished_with === $item`tomayohawk-style reflex hammer`)
        used_banishes.add($skill`Reflex Hammer`);
    }
  });
  if (not_yet_banished.length === 0) return []; // All monsters banished.

  debug(`Banish targets: ${not_yet_banished.join(", ")}`);
  debug(`Banishes used: ${Array.from(used_banishes).join(", ")}`);
  return banishSources.filter((banish) => banish.available() && !used_banishes.has(banish.do));
}

export interface WandererSource extends Resource {
  monsters: Monster[];
  chance: () => number;
  macro?: Macro;
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
    name: "Voted Arm",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myLevel() >= 10 &&
      have($item`mutant arm`),
    equip: $items`"I Voted!" sticker, mutant arm`,
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
    name: "Voted",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3 &&
      myLevel() >= 10,
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
      get("cursedMagnifyingGlassCount") >= 13,
    equip: $item`cursed magnifying glass`,
    monsters: [$monster`void guy`, $monster`void slab`, $monster`void spider`],
    chance: () => 1, // when available
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
  },
  {
    name: "Kramco (Drones)",
    available: () =>
      have($item`Kramco Sausage-o-Matic™`) &&
      myLevel() >= 10 &&
      have($familiar`Grey Goose`) &&
      familiarWeight($familiar`Grey Goose`) >= 6 &&
      getKramcoWandererChance() === 1,
    equip: {
      offhand: $item`Kramco Sausage-o-Matic™`,
      familiar: $familiar`Grey Goose`,
      // Get 11 famexp at the end of the fight, to maintain goose weight
      weapon: $item`yule hatchet`,
      famequip: $item`grey down vest`,
      acc1: $item`teacher's pen`,
      acc2: $item`teacher's pen`,
      acc3: $item`teacher's pen`,
    },
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
    macro: new Macro().trySkill($skill`Emit Matter Duplicating Drones`),
  },
  {
    name: "Kramco",
    available: () => have($item`Kramco Sausage-o-Matic™`) && myLevel() >= 10,
    equip: $item`Kramco Sausage-o-Matic™`,
    monsters: [$monster`sausage goblin`],
    chance: () => getKramcoWandererChance(),
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

// Gear and familiar to use for runaways (i.e., Bandersnatch or Stomping Boots)
const familiarPants =
  $items`repaid diaper, Great Wolf's beastly trousers, Greaves of the Murk Lord`.find((item) =>
    have(item)
  );
const familiarEquip = have($item`astral pet sweater`)
  ? $item`astral pet sweater`
  : have($familiar`Cornbeefadon`)
  ? $item`amulet coin`
  : have($familiar`Mu`)
  ? $item`luck incense`
  : null;
const familiarGear = [
  ...$items`Daylight Shavings Helmet, Buddy Bjorn, Stephen's lab coat, hewn moon-rune spoon`,
  ...(familiarEquip ? [familiarEquip] : []),
  ...(familiarPants ? [familiarPants] : []),
];
const familiarGearBonus =
  5 + sum(familiarGear, (item: Item) => getModifier("Familiar Weight", item));
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

export const runawayValue =
  have($item`Greatest American Pants`) || have($item`navel ring of navel gazing`)
    ? 0.8 * get("valueOfAdventure")
    : get("valueOfAdventure");

export const runawaySources: RunawaySource[] = [
  {
    name: "Bowl Curveball",
    available: () => have($item`cosmic bowling ball`),
    do: new Macro().skill($skill`Bowl a Curveball`),
    chance: () => 1,
    banishes: true,
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
    banishes: true,
  },
  {
    name: "Familiar Runaways",
    available: () =>
      runawayFamiliar !== $familiar`none` &&
      have(runawayFamiliar) &&
      availableFamiliarRunaways(5) > get("_banderRunaways"), // 5 from iFlail
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
    equip: {
      familiar: runawayFamiliar,
      equip: [...familiarGear, $item`iFlail`],
    },
    do: new Macro().runaway(),
    chance: () => 1,
    banishes: false,
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
    equip: {
      familiar: runawayFamiliar,
      equip: [...familiarGear, $item`iFlail`, $item`familiar scrapbook`],
    },
    do: new Macro().runaway(),
    chance: () => 1,
    banishes: false,
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
    chance: () => 1,
    banishes: false,
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
    available: () =>
      have($item`peppermint parasol`) ||
      mallPrice($item`peppermint parasol`) < 10 * get("valueOfAdventure"),
    prepare: () => {
      if (have($item`peppermint parasol`)) return;
      if (itemAmount($item`peppermint sprout`) >= 5) {
        retrieveItem($item`peppermint parasol`);
      } else if (mallPrice($item`peppermint parasol`) < 5 * mallPrice($item`peppermint sprout`)) {
        buy($item`peppermint parasol`, 1, mallPrice($item`peppermint parasol`));
      } else {
        buy(
          $item`peppermint sprout`,
          5 - itemAmount($item`peppermint sprout`),
          mallPrice($item`peppermint sprout`)
        );
        retrieveItem($item`peppermint parasol`);
      }
    },
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
