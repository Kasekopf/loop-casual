import { buy, myLevel, use, visitUrl } from "kolmafia";
import { $familiar, $item, $items, $location, $monster, get, have } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

const Diary: Task[] = [
  {
    name: "Forest",
    after: [],
    completed: () => step("questL11Black") >= 2,
    do: $location`The Black Forest`,
    equip: $items`blackberry galoshes`,
    familiar: $familiar`Reassembled Blackbird`,
    modifier: "+combat 5min",
    choices: { 923: 1, 924: 1 },
    combat: new CombatStrategy().flee($monster`blackberry bush`).kill(),
  },
  {
    name: "Buy Documents",
    after: ["Forest"],
    completed: () => step("questL11Black") >= 3,
    do: () => buy($item`forged identification documents`),
    cap: 1,
  },
  {
    name: "Diary",
    after: ["Buy Documents"],
    completed: () => step("questL11Black") >= 4,
    do: $location`The Shore, Inc. Travel Agency`,
    choices: { 793: 1 },
    cap: 1,
  },
];

const Desert: Task[] = [
  {
    name: "Desert",
    after: ["Diary"],
    completed: () => get("desertExploration") >= 100,
    prepare: (): void => {
      if (have($item`desert sightseeing pamphlet`)) use($item`desert sightseeing pamphlet`);
    },
    do: $location`The Arid, Extra-Dry Desert`,
    equip: $items`ornate dowsing rod`, // TODO: get
    familiar: $familiar`Melodramedary`,
    combat: new CombatStrategy().kill(),
    delay: 18,
  },
  {
    name: "Gnasir Paint",
    after: ["Diary"],
    completed: () => (get("gnasirProgress") & 2) === 1 || get("desertExploration") >= 100,
    ready: () => $location`The Arid, Extra-Dry Desert`.noncombatQueue.includes("A Sietch in Time"),
    do: () => visitUrl("place.php?whichplace=desertbeach&action=db_gnasir"),
    cap: 1,
  },
  {
    name: "Gnasir Killing Jar",
    after: ["Diary"],
    completed: () => (get("gnasirProgress") & 4) === 1 || get("desertExploration") >= 100,
    ready: () => $location`The Arid, Extra-Dry Desert`.noncombatQueue.includes("A Sietch in Time"),
    do: () => visitUrl("place.php?whichplace=desertbeach&action=db_gnasir"),
    cap: 1,
  },
];

const Pyramid: Task[] = [
  {
    name: "Open Pyramid",
    after: ["Desert", "Manor/Boss", "Palindome/Boss", "Hidden City/Boss"],
    completed: () => step("questL11Pyramid") >= 0,
    do: () => visitUrl("place.php?whichplace=desertbeach&action=db_pyramid1"),
    cap: 1,
  },
  {
    name: "Upper Chamber",
    after: ["Open Pyramid"],
    completed: () => step("questL11Pyramid") >= 1,
    do: $location`The Upper Chamber`,
    modifier: "+combat",
    cap: 6,
  },
  {
    name: "Middle Chamber",
    after: ["Upper Chamber"],
    completed: () => get("controlRoomUnlock"),
    do: $location`The Middle Chamber`,
    cap: 10,
    delay: 9,
  },
  {
    name: "Get Token",
    after: ["Middle Chamber"],
    completed: () =>
      have($item`ancient bronze token`) || have($item`ancient bomb`) || get("lowerChamberUnlock"),
    do: () => {
      throw "Pyramid not implemented";
    },
    cap: 1,
  },
  {
    name: "Get Bomb",
    after: ["Get Token"],
    completed: () => have($item`ancient bomb`) || get("lowerChamberUnlock"),
    do: () => {
      throw "Pyramid not implemented";
    },
    cap: 1,
  },
  {
    name: "Use Bomb",
    after: ["Get Bomb"],
    completed: () => get("lowerChamberUnlock"),
    do: () => {
      throw "Pyramid not implemented";
    },
    cap: 1,
  },
  {
    name: "Boss",
    after: ["Use Bomb"],
    completed: () => step("questL11Pyramid") === 999,
    do: () => visitUrl("place.php?whichplace=pyramid&action=pyramid_state1a"),
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

export const MacguffinQuest: Quest = {
  name: "Macguffin",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 11,
      completed: () => step("questL11MacGuffin") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    ...Diary,
    ...Desert,
    ...Pyramid,
    {
      name: "Finish",
      after: [],
      completed: () => step("questL11MacGuffin") === 999,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
  ],
};
