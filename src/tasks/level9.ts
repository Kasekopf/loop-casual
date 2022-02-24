import { itemAmount, use, visitUrl } from "kolmafia";
import { $effect, $item, $location, get, have } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

const ABoo: Task[] = [
  {
    name: "ABoo Start",
    after: ["Start Peaks"],
    completed: () =>
      $location`A-Boo Peak`.noncombatQueue.includes("Faction Traction = Inaction") ||
      get("booPeakProgress") < 50,
    do: $location`A-Boo Peak`,
    limit: { tries: 1 },
  },
  {
    name: "ABoo Clues",
    after: ["ABoo Start"],
    acquire: [
      { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
    ],
    completed: () => itemAmount($item`A-Boo clue`) * 30 >= get("booPeakProgress"),
    do: $location`A-Boo Peak`,
    outfit: { modifier: "item 667max" },
    combat: new CombatStrategy().killHard(),
    choices: { 611: 1, 1430: 1 },
    limit: { tries: 4 },
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
    outfit: { modifier: "spooky res, cold res, HP" },
    choices: { 611: 1 },
    limit: { tries: 4 },
  },
  {
    name: "ABoo Peak",
    after: ["ABoo Horror"],
    completed: () => get("booPeakLit"),
    do: $location`A-Boo Peak`,
    limit: { tries: 1 },
  },
];

const Oil: Task[] = [
  {
    name: "Oil Kill",
    after: ["Start Peaks"],
    completed: () => get("oilPeakProgress") === 0,
    do: $location`Oil Peak`,
    outfit: { modifier: "ML" },
    combat: new CombatStrategy().kill(),
    limit: { tries: 6 },
  },
  {
    name: "Oil Peak",
    after: ["Oil Kill"],
    completed: () => get("oilPeakLit"),
    do: $location`Oil Peak`,
    limit: { tries: 1 },
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
    acquire: [{ item: $item`rusty hedge trimmers` }],
    outfit: { modifier: "stench res 4min" },
    limit: { tries: 1 },
  },
  {
    name: "Twin Item",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 2),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 2, 608: 1 },
    acquire: [{ item: $item`rusty hedge trimmers` }],
    outfit: { modifier: "item 50min" },
    limit: { tries: 1 },
  },
  {
    name: "Twin Oil",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 4),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 3, 609: 1, 616: 1 },
    acquire: [{ item: $item`rusty hedge trimmers` }, { item: $item`jar of oil` }],
    limit: { tries: 1 },
  },
  {
    name: "Twin Init",
    after: ["Twin Stench", "Twin Item", "Twin Oil"],
    completed: () => !!(get("twinPeakProgress") & 8),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 4, 610: 1, 1056: 1 },
    acquire: [{ item: $item`rusty hedge trimmers` }],
    limit: { tries: 1 },
  },
];

export const ChasmQuest: Quest = {
  name: "Orc Chasm",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(9),
      completed: () => step("questL09Topping") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Bridge",
      after: ["Start"],
      completed: () => step("questL09Topping") >= 1,
      do: $location`The Smut Orc Logging Camp`,
      post: (): void => {
        if (have($item`smut orc keepsake box`)) use($item`smut orc keepsake box`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
      },
      outfit: { modifier: "item" },
      combat: new CombatStrategy().kill(),
      choices: { 1345: 1 },
      limit: { soft: 32 },
    },
    {
      name: "Start Peaks",
      after: ["Bridge"],
      completed: () => step("questL09Topping") >= 2,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...ABoo,
    ...Oil,
    ...Twin,
    {
      name: "Finish",
      after: ["ABoo Peak", "Oil Peak", "Twin Init"],
      completed: () => step("questL09Topping") === 999,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
