import { cliExecute, myHp, myMaxhp, restoreHp, runChoice, use, visitUrl } from "kolmafia";
import {
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $stat,
  get,
  have,
  Macro,
} from "libram";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { absorbtionTargets } from "./absorb";
import { Quest, step, Task } from "./structure";

const Challenges: Task[] = [
  {
    name: "Speed Challenge",
    after: ["Start"],
    completed: () => get("nsContestants1") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(1);
      runChoice(6);
    },
    outfit: { modifier: "init" },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Moxie Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === $stat`Moxie`,
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
    ready: () => get("nsChallenge1") === $stat`Muscle`,
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
    ready: () => get("nsChallenge1") === $stat`Mysticality`,
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
    ready: () => get("nsChallenge2") === "hot",
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
    ready: () => get("nsChallenge2") === "cold",
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
    ready: () => get("nsChallenge2") === "spooky",
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
    ready: () => get("nsChallenge2") === "stench",
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
    ready: () => get("nsChallenge2") === "sleaze",
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
    combat: new CombatStrategy(true).killHard(),
    limit: { tries: 1 },
  },
  {
    name: "Stat Boss",
    after: ["Muscle Challenge", "Moxie Challenge", "Mysticality Challenge"],
    completed: () => get("nsContestants2") === 0,
    do: $location`A Crowd of (Stat) Adventurers`,
    combat: new CombatStrategy(true).killHard(),
    limit: { tries: 1 },
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
    combat: new CombatStrategy(true).killHard(),
    limit: { tries: 10 },
  },
];

const Door: Task[] = [
  {
    name: "Boris Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Boris's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Boris"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock1"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Jarlsberg Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Jarlsberg's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Jarlsberg"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock2"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Sneaky Pete Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Sneaky Pete's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Sneaky Pete"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock3"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Star Lock",
    after: ["Maze", "Giant/Hole in the Sky"],
    acquire: [{ item: $item`Richard's star key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Richard's star key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock4"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Digital Lock",
    after: ["Maze", "Keys/Digital Key"],
    acquire: [{ item: $item`digital key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("digital key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock5"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Skeleton Lock",
    after: ["Maze"],
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
        if (myHp() < myMaxhp()) {
          restoreHp(myMaxhp());
        }
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
      name: "Wall of Skin",
      after: ["Door"],
      prepare: () => {
        if (myHp() < myMaxhp()) {
          restoreHp(myMaxhp());
        }
      },
      completed: () => step("questL13Final") > 6,
      do: $location`Tower Level 1`,
      outfit: { familiar: $familiar`Shorter-Order Cook`, equip: $items`hot plate` },
      combat: new CombatStrategy(true).macro(new Macro().skill($skill`Grey Noise`).repeat()),
      limit: { tries: 1 },
    },
    {
      name: "Wall of Meat",
      after: ["Wall of Skin"],
      prepare: () => {
        if (myHp() < myMaxhp()) {
          restoreHp(myMaxhp());
        }
      },
      completed: () => step("questL13Final") > 7,
      do: $location`Tower Level 2`,
      outfit: { modifier: "meat" },
      combat: new CombatStrategy(true).killHard(),
      limit: { tries: 2 },
    },
    {
      name: "Wall of Bones",
      after: ["Wall of Meat", "Giant/Ground Knife"],
      completed: () => step("questL13Final") > 8,
      do: $location`Tower Level 3`,
      combat: new CombatStrategy(true).macro(new Macro().item($item`electric boning knife`)),
      limit: { tries: 1 },
    },
    {
      name: "Wand Parts",
      after: ["Wall of Bones"],
      ready: () => have($item`11-leaf clover`),
      completed: () =>
        have($item`Wand of Nagamar`) ||
        ((have($item`WA`) || (have($item`ruby W`) && have($item`metallic A`))) &&
          (have($item`ND`) || (have($item`lowercase N`) && have($item`heavy D`)))),
      prepare: () => use($item`11-leaf clover`),
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      limit: { tries: 1 },
    },
    {
      name: "Mirror",
      after: ["Wand Parts"],
      acquire: [{ item: $item`Wand of Nagamar` }],
      completed: () => step("questL13Final") > 9,
      do: $location`Tower Level 4`,
      choices: { 1015: 2 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Shadow",
      after: ["Mirror"],
      prepare: () => {
        if (
          have($item`unwrapped knock-off retro superhero cape`) &&
          (get("retroCapeSuperhero") !== "heck" || get("retroCapeWashingInstructions") !== "hold")
        ) {
          cliExecute("retrocape heck hold");
        }
        if (myHp() < myMaxhp()) {
          restoreHp(myMaxhp());
        }
      },
      completed: () => step("questL13Final") > 10,
      do: $location`Tower Level 5`,
      outfit: { modifier: "init", equip: $items`unwrapped knock-off retro superhero cape` },
      combat: new CombatStrategy(true).macro(new Macro().item($item`gauze garter`).repeat()),
      limit: { tries: 1 },
    },
    {
      name: "Naughty Sorceress",
      after: ["Shadow"],
      completed: () => step("questL13Final") > 11,
      do: $location`The Naughty Sorceress' Chamber`,
      post: () => {
        absorbtionTargets.ignoreUselessAbsorbs(); // Ignore remaining skills
      },
      outfit: { modifier: "muscle" },
      combat: new CombatStrategy(true).kill(),
      limit: { tries: 1 },
    },
    // {
    //   name: "Finish",
    //   after: ["Naughty Sorceress"],
    //   completed: () => step("questL13Final") === 999,
    //   do: () => visitUrl("place.php?whichplace=nstower&action=ns_11_prism"),
    //   limit: { tries: 1 },
    //   freeaction: true,
    // },
  ],
};
