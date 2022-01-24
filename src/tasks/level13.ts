import { myLevel, runChoice, useSkill, visitUrl } from "kolmafia";
import { $effects, $familiar, $item, $items, $location, $skill, get, Macro } from "libram";
import { CombatStrategy } from "../combat";
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
    modifier: "init",
    cap: 1,
    freeaction: true,
  },
  {
    name: "Moxie Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === "Moxie",
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    modifier: "moxie",
    cap: 1,
    freeaction: true,
  },
  {
    name: "Muscle Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === "Muscle",
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    modifier: "muscle",
    cap: 1,
    freeaction: true,
  },
  {
    name: "Mysticality Challenge",
    after: ["Start"],
    ready: () => get("nsChallenge1") === "Mysticality",
    completed: () => get("nsContestants2") > -1,
    do: (): void => {
      visitUrl("place.php?whichplace=nstower&action=ns_01_contestbooth");
      runChoice(2);
      runChoice(6);
    },
    modifier: "mysticality",
    cap: 1,
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
    modifier: "hot dmg, hot spell dmg",
    cap: 1,
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
    modifier: "cold dmg, cold spell dmg",
    cap: 1,
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
    modifier: "spooky dmg, spooky spell dmg",
    cap: 1,
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
    modifier: "stench dmg, stench spell dmg",
    cap: 1,
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
    modifier: "sleaze dmg, sleaze spell dmg",
    cap: 1,
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
    cap: 1,
  },
  {
    name: "Stat Boss",
    after: ["Muscle Challenge", "Moxie Challenge", "Mysticality Challenge"],
    completed: () => get("nsContestants2") === 0,
    do: $location`A Crowd of (Stat) Adventurers`,
    combat: new CombatStrategy(true).killHard(),
    cap: 1,
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
    cap: 1,
  },
];

const Door: Task[] = [
  {
    name: "Boris Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Boris's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Boris"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock1"),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Jarlsberg Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Jarlsberg's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Jarlsberg"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock2"),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Sneaky Pete Lock",
    after: ["Maze", "Keys/Finish"],
    acquire: [{ item: $item`Sneaky Pete's key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Sneaky Pete"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock3"),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Star Lock",
    after: ["Maze"],
    acquire: [{ item: $item`Richard's star key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("Richard's star key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock4"),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Digital Lock",
    after: ["Maze"],
    acquire: [{ item: $item`digital key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("digital key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock5"),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Skeleton Lock",
    after: ["Maze"],
    acquire: [{ item: $item`skeleton key` }],
    completed: () => get("nsTowerDoorKeysUsed").includes("skeleton key"),
    do: () => visitUrl("place.php?whichplace=nstower_door&action=ns_lock6"),
    cap: 1,
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
    cap: 1,
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
        "War/Boss Frat",
      ],
      ready: () => myLevel() >= 13,
      completed: () => step("questL13Final") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
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
      cap: 1,
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
      cap: 1,
    },
    {
      name: "Maze",
      after: ["Frank"],
      completed: () => step("questL13Final") > 4,
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      do: $location`The Hedge Maze`,
      choices: { 1004: 1, 1005: 2, 1008: 2, 1011: 2, 1013: 1, 1022: 1 },
      modifier: "hot res, cold res, stench res, spooky res, sleaze res",
      familiar: $familiar`Exotic Parrot`,
      cap: 1,
    },
    ...Door,
    {
      name: "Wall of Skin",
      after: ["Door"],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      completed: () => step("questL13Final") > 6,
      do: $location`Tower Level 1`,
      effects: $effects`Spiky Shell, Jalapeño Saucesphere, Psalm of Pointiness, Scarysauce`,
      familiar: $familiar`Imitation Crab`,
      combat: new CombatStrategy(true).macro(new Macro().attack().repeat()),
      equip: $items`bejeweled cufflinks`,
      cap: 1,
    },
    {
      name: "Wall of Meat",
      after: ["Wall of Skin"],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      completed: () => step("questL13Final") > 7,
      do: $location`Tower Level 2`,
      modifier: "meat",
      combat: new CombatStrategy(true).killHard(),
      cap: 1,
    },
    {
      name: "Wall of Bones",
      after: ["Wall of Meat"],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      completed: () => step("questL13Final") > 8,
      do: $location`Tower Level 3`,
      modifier: "spell dmg",
      combat: new CombatStrategy(true).macro(new Macro().skill($skill`Garbage Nova`).repeat()),
      cap: 1,
    },
    {
      name: "Mirror",
      after: ["Wall of Bones"],
      acquire: [{ item: $item`Wand of Nagamar` }],
      completed: () => step("questL13Final") > 9,
      do: $location`Tower Level 4`,
      choices: { 1015: 2 },
      cap: 1,
      freeaction: true,
    },
    {
      name: "Shadow",
      after: ["Mirror"],
      acquire: [{ item: $item`gauze garter`, num: 5 }],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      completed: () => step("questL13Final") > 10,
      do: $location`Tower Level 5`,
      modifier: "init",
      combat: new CombatStrategy(true).macro(
        new Macro().item([$item`gauze garter`, $item`gauze garter`]).repeat()
      ),
      cap: 1,
    },
    {
      name: "Naughty Sorceress",
      after: ["Shadow"],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      completed: () => step("questL13Final") > 11,
      do: $location`The Naughty Sorceress' Chamber`,
      modifier: "muscle",
      combat: new CombatStrategy(true).kill(),
      cap: 1,
    },
    {
      name: "Finish",
      after: ["Naughty Sorceress"],
      completed: () => step("questL13Final") === 999,
      do: () => visitUrl("place.php?whichplace=nstower&action=ns_11_prism"),
      cap: 1,
      freeaction: true,
    },
  ],
};
