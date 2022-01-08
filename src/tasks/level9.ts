import { buy, cliExecute, floor, itemAmount, myLevel, use, visitUrl } from "kolmafia";
import { $item, $location, get, have } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

const ABoo: Task[] = [
  {
    name: "ABoo Clues",
    after: ["Start Peaks"],
    completed: () => itemAmount($item`A-Boo clue`) * 30 >= get("booPeakProgress"),
    prepare: () => {
      // eslint-disable-next-line libram/verify-constants
      use($item`11-leaf clover`);
    },
    do: $location`A-Boo Peak`,
    cap: 2,
  },
  {
    name: "ABoo Horror",
    after: ["ABoo Clues"],
    ready: () => have($item`A-Boo clue`),
    completed: () => get("booPeakProgress") === 0,
    prepare: () => {
      use($item`A-Boo clue`);
    },
    do: $location`A-Boo Peak`,
    modifier: "spooky res, cold res",
    choices: { 611: 1 },
    cap: 4,
  },
  {
    name: "ABoo Peak",
    after: ["ABoo Horror"],
    completed: () => get("booPeakLit"),
    do: $location`A-Boo Peak`,
    cap: 1,
  },
];

const Oil: Task[] = [
  {
    name: "Oil Kill",
    after: ["Start Peaks"],
    completed: () => get("oilPeakProgress") === 0,
    do: $location`Oil Peak`,
    modifier: "ML",
    combat: new CombatStrategy().kill(),
    cap: 5,
  },
  {
    name: "Oil Peak",
    after: ["Oil Kill"],
    completed: () => get("oilPeakLit"),
    do: $location`Oil Peak`,
    cap: 1,
  },
];

const Twin: Task[] = [
  {
    name: "Twin Stench",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 1),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 1, 607: 1 },
    modifier: "stench res 4min",
    cap: 1,
  },
  {
    name: "Twin Item",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 2),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 2, 608: 1 },
    modifier: "item 50min",
    cap: 1,
  },
  {
    name: "Twin Oil",
    after: ["Start Peaks"],
    ready: () => have($item`jar of oil`),
    completed: () => !!(get("twinPeakProgress") & 4),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 3, 609: 1, 616: 1 },
    cap: 1,
  },
  {
    name: "Twin Init",
    after: ["Twin Stench", "Twin Item", "Twin Oil"],
    completed: () => !!(get("twinPeakProgress") & 8),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 4, 610: 1, 1056: 1 },
    cap: 1,
  },
];

export const ChasmQuest: Quest = {
  name: "Orc Chasm",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 9,
      completed: () => step("questL09Topping") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Bridge",
      after: ["Start"],
      completed: () => step("questL09Topping") >= 1,
      do: (): void => {
        const count = floor((34 - get("chasmBridgeProgress")) / 5);
        if (count <= 0) return;
        buy(2 * count, $item`snow berries`, 6000);
        cliExecute(`acquire ${count} snow boards`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`);
      },
      cap: 1,
    },
    {
      name: "Start Peaks",
      after: ["Bridge"],
      completed: () => step("questL09Topping") >= 2,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      cap: 1,
    },
    ...ABoo,
    ...Oil,
    ...Twin,
    {
      name: "Finish",
      after: ["ABoo Peak", "Oil Peak", "Twin Init"],
      completed: () => step("questL09Topping") === 999,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      cap: 1,
    },
  ],
};
