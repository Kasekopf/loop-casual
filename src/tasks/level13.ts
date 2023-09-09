import {
  buy,
  cliExecute,
  haveEquipped,
  itemAmount,
  myBuffedstat,
  myHp,
  myMaxhp,
  myMeat,
  myTurncount,
  restoreHp,
  retrieveItem,
  runChoice,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { args } from "../args";
import { Quest, Task } from "../engine/task";
import { step } from "grimoire-kolmafia";

const Challenges: Task[] = [
  {
    name: "Speed Challenge",
    after: ["Start", "Absorb/Overclocking"],
    ready: () => towerReady(),
    completed: () => get("nsContestants1") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(1);
      runChoice(6);
    },
    outfit: { modifier: "init", familiar: $familiar`Oily Woim` },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Moxie Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === $stat`Moxie` && towerReady(),
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    outfit: { modifier: "moxie" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Muscle Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === $stat`Muscle` && towerReady(),
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    outfit: { modifier: "muscle" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Mysticality Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === $stat`Mysticality` && towerReady(),
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    outfit: { modifier: "mysticality" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Hot Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge2") === "hot" && towerReady(),
    completed: () => get("nsContestants3") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(3);
      runChoice(6);
    },
    outfit: { modifier: "hot dmg, hot spell dmg" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Cold Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge2") === "cold" && towerReady(),
    completed: () => get("nsContestants3") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(3);
      runChoice(6);
    },
    outfit: { modifier: "cold dmg, cold spell dmg" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Spooky Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge2") === "spooky" && towerReady(),
    completed: () => get("nsContestants3") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(3);
      runChoice(6);
    },
    outfit: { modifier: "spooky dmg, spooky spell dmg" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Stench Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge2") === "stench" && towerReady(),
    completed: () => get("nsContestants3") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(3);
      runChoice(6);
    },
    outfit: { modifier: "stench dmg, stench spell dmg" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Sleaze Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge2") === "sleaze" && towerReady(),
    completed: () => get("nsContestants3") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(3);
      runChoice(6);
    },
    outfit: { modifier: "sleaze dmg, sleaze spell dmg" },
    limit: { tries: 1 },
    freeaction: true,
  },
];

const ChallengeBosses: Task[] = [
  {
    name: "Speed Boss",
    after: ["Speed Challenge"],
    completed: () => get("nsContestants1") === 0,
    do: $location`Fastest Adventurer Contest`,
    combat: new CombatStrategy().killHard(),
    limit: { tries: 5 },
    boss: true,
  },
  {
    name: "Stat Boss",
    after: ["Muscle Challenge", "Moxie Challenge", "Mysticality Challenge"],
    completed: () => get("nsContestants2") === 0,
    do: $location`A Crowd of (Stat) Adventurers`,
    combat: new CombatStrategy().killHard(),
    limit: { tries: 1 },
    boss: true,
  },
  {
    name: "Element Boss",
    after: [
      "Hot Challenge",
      "Cold Challenge",
      "Spooky Challenge",
      "Stench Challenge",
      "Sleaze Challenge",
    ],
    completed: () => get("nsContestants3") === 0,
    do: $location`A Crowd of (Element) Adventurers`,
    combat: new CombatStrategy().killHard(),
    limit: { tries: 10 },
    boss: true,
  },
];

const Door: Task[] = [
  {
    name: "Boris Lock",
    after: ["Maze", "Keys/All Heroes"],
    acquire: [{ item: $item`Boris's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Boris"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock1"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Jarlsberg Lock",
    after: ["Maze", "Keys/All Heroes"],
    acquire: [{ item: $item`Jarlsberg's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Jarlsberg"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock2"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Sneaky Pete Lock",
    after: ["Maze", "Keys/All Heroes"],
    acquire: [{ item: $item`Sneaky Pete's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Sneaky Pete"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock3"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Star Lock",
    after: ["Maze", "Keys/Star Key"],
    acquire: [{ item: $item`Richard's star key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Richard's star key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock4"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Digital Lock",
    after: ["Maze", "Digital/Key"],
    completed: () => get("nsTowerDoorKeysUsed").includes("digital key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock5"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Skeleton Lock",
    after: ["Maze", "Keys/Skeleton Key"],
    acquire: [{ item: $item`skeleton key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("skeleton key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock6"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Door",
    after: [
      "Boris Lock",
      "Jarlsberg Lock",
      "Sneaky Pete Lock",
      "Star Lock",
      "Digital Lock",
      "Skeleton Lock",
    ],
    completed: () => step("questL13Final") > 5,
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_doorknob"),
    limit: { tries: 1 },
    freeaction: true,
  },
];

const wand: Task[] = [
  {
    name: "Wand W",
    after: ["Wall of Bones"],
    ready: () => !have($item`11-leaf clover`),
    completed: () =>
      have($item`ruby W`) || have($item`WA`) || have($item`Wand of Nagamar`) || towerSkip(),
    do: $location`Pandamonium Slums`,
    outfit: { modifier: "item" },
    combat: new CombatStrategy().killItem($monster`W imp`),
    limit: { soft: 20 },
  },
  {
    name: "Wand A",
    after: ["Wall of Bones"],
    ready: () => !have($item`11-leaf clover`),
    completed: () =>
      have($item`metallic A`) || have($item`WA`) || have($item`Wand of Nagamar`) || towerSkip(),
    do: $location`The Penultimate Fantasy Airship`,
    outfit: { modifier: "item" },
    combat: new CombatStrategy().killItem($monster`MagiMechTech MechaMech`),
    limit: { soft: 20 },
  },
  {
    name: "Wand N",
    after: ["Wall of Bones"],
    ready: () => !have($item`11-leaf clover`),
    completed: () =>
      have($item`lowercase N`) || have($item`ND`) || have($item`Wand of Nagamar`) || towerSkip(),
    do: $location`The Valley of Rof L'm Fao`,
    outfit: { modifier: "item" },
    combat: new CombatStrategy().killItem($monster`XXX pr0n`),
    limit: { soft: 20 },
  },
  {
    name: "Wand D",
    after: ["Wall of Bones"],
    ready: () => !have($item`11-leaf clover`),
    completed: () =>
      have($item`heavy D`) || have($item`ND`) || have($item`Wand of Nagamar`) || towerSkip(),
    do: $location`The Castle in the Clouds in the Sky (Basement)`,
    outfit: { modifier: "item" },
    combat: new CombatStrategy().killItem($monster`Alphabet Giant`),
    limit: { soft: 20 },
  },
  {
    name: "Wand Parts",
    after: ["Wall of Bones"],
    ready: () => have($item`11-leaf clover`),
    completed: () =>
      have($item`Wand of Nagamar`) ||
      ((have($item`WA`) || (have($item`ruby W`) && have($item`metallic A`))) &&
        (have($item`ND`) || (have($item`lowercase N`) && have($item`heavy D`)))) ||
      towerSkip(),
    prepare: () => use($item`11-leaf clover`),
    do: $location`The Castle in the Clouds in the Sky (Basement)`,
    limit: { tries: 1 },
  },
  {
    name: "Wand",
    ready: () => towerReady(),
    after: ["Wand W", "Wand A", "Wand N", "Wand D", "Wand Parts"],
    completed: () => have($item`Wand of Nagamar`),
    do: () => {
      cliExecute("make Wand of Nagamar");
    },
    limit: { tries: 1 },
  },
];

export const TowerQuest: Quest = {
  name: "Tower",
  tasks: [
    {
      name: "Start",
      after: [
        "Mosquito/Finish",
        "Tavern/Finish",
        "Bat/Finish",
        "Knob/King",
        "Friar/Finish",
        "Crypt/Finish",
        "McLargeHuge/Finish",
        "Orc Chasm/Finish",
        "Giant/Finish",
        "Macguffin/Finish",
        "War/Boss Hippie",
      ],
      ready: () => atLevel(13),
      completed: () => step("questL13Final") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Challenges,
    ...ChallengeBosses,
    {
      name: "Coronation",
      after: ["Speed Boss", "Stat Boss", "Element Boss"],
      completed: () => step("questL13Final") > 2,
      do: (): void => {
        visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
        runChoice(-1);
      },
      choices: { 1003: 4 },
      limit: { tries: 1 },
    },
    {
      name: "Frank",
      after: ["Coronation"],
      completed: () => step("questL13Final") > 3,
      do: (): void => {
        visitUrl("place.php?whichplace=nstower&action=ns_02_coronation");
        runChoice(-1);
      },
      choices: { 1020: 1, 1021: 1, 1022: 1 },
      limit: { tries: 1 },
    },
    {
      name: "Maze",
      after: ["Frank"],
      completed: () => step("questL13Final") > 4,
      prepare: () => {
        fillHp();
      },
      do: $location`The Hedge Maze`,
      choices: { 1004: 1, 1005: 2, 1008: 2, 1011: 2, 1013: 1, 1022: 1 },
      outfit: {
        modifier: "hot res, cold res, stench res, spooky res, sleaze res",
        familiar: $familiar`Exotic Parrot`,
      },
      effects: $effects`Red Door Syndrome`,
      limit: { tries: 1 },
    },
    ...Door,
    {
      name: "Beehive",
      after: ["Macguffin/Forest"],
      completed: () =>
        have($item`beehive`) || have($familiar`Shorter-Order Cook`) || step("questL13Final") > 6,
      do: $location`The Black Forest`,
      choices: {
        923: 1,
        924: 3,
        1018: 1,
        1019: 1,
      },
      outfit: { modifier: "-combat" },
      limit: { soft: 5 },
    },
    {
      name: "Wall of Skin",
      after: ["Door", "Beehive"],
      prepare: () => {
        if (have($item`handful of hand chalk`)) ensureEffect($effect`Chalky Hand`);
        fillHp();
      },
      completed: () => step("questL13Final") > 6,
      do: $location`Tower Level 1`,
      outfit: { familiar: $familiar`Shorter-Order Cook`, equip: $items`hot plate` },
      combat: new CombatStrategy().macro(
        new Macro()
          .tryItem($item`beehive`)
          .skill($skill`Grey Noise`)
          .repeat()
      ),
      boss: true,
      limit: { tries: 1 },
    },
    {
      name: "Wall of Meat",
      after: ["Wall of Skin"],
      prepare: () => {
        fillHp();
      },
      completed: () => step("questL13Final") > 7,
      do: $location`Tower Level 2`,
      outfit: () => {
        if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l pirate costume`)) {
          return {
            modifier: "meat",
            familiar: $familiar`Trick-or-Treating Tot`,
            equip: $items`li'l pirate costume`,
          };
        }
        return {
          modifier: "meat",
          equip: $items`amulet coin`, // Use amulet coin (if we have) to avoid using orb
        };
      },
      combat: new CombatStrategy().killHard(),
      boss: true,
      limit: { tries: 2 },
    },
    {
      name: "Wall of Bones",
      after: ["Wall of Meat", "Giant/Ground Knife"],
      completed: () => step("questL13Final") > 8,
      prepare: () => {
        if (have($item`electric boning knife`)) return;
        if (haveEquipped($item`Great Wolf's rocket launcher`)) {
          if (myBuffedstat($stat`moxie`) < 1000) ensureEffect($effect`Cock of the Walk`);
          if (myBuffedstat($stat`moxie`) < 1000) ensureEffect($effect`Superhuman Sarcasm`);
          if (myBuffedstat($stat`moxie`) < 1000) ensureEffect($effect`Gr8ness`);
          fillHp();
        } else if (have($item`Drunkula's bell`)) {
          if (myBuffedstat($stat`mysticality`) < 2700)
            ensureEffect($effect`On the Shoulders of Giants`);
          if (myBuffedstat($stat`mysticality`) < 2700) ensureEffect($effect`Mystically Oiled`);
          if (myBuffedstat($stat`mysticality`) < 2700) ensureEffect($effect`Gr8ness`);
        }
      },
      do: $location`Tower Level 3`,
      outfit: () => {
        if (have($item`Great Wolf's rocket launcher`))
          return { equip: $items`Great Wolf's rocket launcher`, modifier: "moxie" };
        if (have($item`Drunkula's bell`)) return { modifier: "myst" };
        return {};
      },
      combat: new CombatStrategy().macro(() => {
        if (have($item`electric boning knife`)) return Macro.item($item`electric boning knife`);
        if (haveEquipped($item`Great Wolf's rocket launcher`))
          return Macro.skill($skill`Fire Rocket`);
        if (have($item`Drunkula's bell`)) return Macro.item($item`Drunkula's bell`);
        throw `Unable to find way to kill Wall of Bones`;
      }),
      boss: true,
      limit: { tries: 1 },
    },
    ...wand,
    {
      name: "Mirror",
      after: ["Wall of Bones", "Wand"],
      acquire: [{ item: $item`Wand of Nagamar` }],
      completed: () => step("questL13Final") > 9,
      do: $location`Tower Level 4`,
      choices: { 1015: 2 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Shadow",
      after: ["Mirror", "Absorb/Overclocking"],
      prepare: () => {
        fillHp();

        // Buy garters here instead of in acquire,
        // since the amount needed depends on Max HP.
        const garters_needed =
          Math.min(20, Math.ceil((100 + myMaxhp() / 6) / 80)) - itemAmount($item`gauze garter`);
        if (garters_needed > 0 && myTurncount() >= 1000) {
          buy($item`gauze garter`, garters_needed, 500);
        }
      },
      completed: () => step("questL13Final") > 10,
      do: $location`Tower Level 5`,
      outfit: () => ({
        equip: $items`unwrapped knock-off retro superhero cape, Jurassic Parka, attorney's badge`,
        modes: {
          parka: "kachungasaur",
          retrocape: ["heck", "hold"],
        },
        modifier: "HP",
        avoid: $items`extra-wide head candle`,
      }),
      combat: new CombatStrategy().macro(new Macro().item($item`gauze garter`).repeat()),
      boss: true,
      limit: { tries: 1 },
    },
    {
      name: "Naughty Sorceress",
      after: ["Shadow"],
      completed: () => step("questL13Final") > 11,
      do: $location`The Naughty Sorceress' Chamber`,
      outfit: { modifier: "muscle" },
      combat: new CombatStrategy().kill(),
      boss: true,
      limit: { tries: 1 },
    },
  ],
};

export function fillHp() {
  if (myHp() < myMaxhp()) {
    if (!restoreHp(myMaxhp())) {
      // Backup healing plan in a pinch
      if (have($item`scroll of drastic healing`)) {
        use($item`scroll of drastic healing`);
      } else if (
        get("_hotTubSoaks") < 5 &&
        ($effects`Once-Cursed, Twice-Cursed, Thrice-Cursed`.find((e) => have(e)) === undefined ||
          get("hiddenApartmentProgress") >= 7)
      ) {
        visitUrl("clan_viplounge.php?action=hottub");
      }
      let tries = 0;
      while (myHp() < myMaxhp() && myMeat() >= 1000 && tries < 30) {
        tries++;
        retrieveItem($item`Doc Galaktik's Homeopathic Elixir`);
        use($item`Doc Galaktik's Homeopathic Elixir`);
      }
    }
  }
}

/* Skip this until ronin if the tower is delayed. */
export function towerReady() {
  return !args.major.delaytower || myTurncount() >= 1000;
}

/* Skip this entirely, either post-ronin or when delaying until ronin. */
export function towerSkip() {
  return args.major.delaytower || myTurncount() >= 1000;
}
