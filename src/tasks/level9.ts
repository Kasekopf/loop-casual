import {
  itemAmount,
  myBasestat,
  myMaxmp,
  myMeat,
  myMp,
  numericModifier,
  restoreMp,
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
  $monsters,
  $skill,
  $stat,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { OverridePriority } from "../priority";
import { councilSafe } from "./level12";
import { fillHp } from "./level13";

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
    completed: () => itemAmount($item`A-Boo clue`) * 30 >= get("booPeakProgress"),
    do: $location`A-Boo Peak`,
    outfit: { modifier: "item", equip: $items`Space Trip safety headphones, HOA regulation book` },
    combat: new CombatStrategy()
      .macro(
        () => (numericModifier("Monster Level") < -45 ? new Macro() : new Macro().attack().repeat()) // Attack the ghost directly if ML is too high
      )
      .killItem(),
    choices: { 611: 1, 1430: 1 },
    limit: { soft: 10 },
  },
  {
    name: "ABoo Horror",
    after: [
      "ABoo Start",
      "Absorb/The Batrat and Ratbat Burrow",
      "Absorb/The Spooky Forest",
      "Absorb/The eXtreme Slope",
      "Absorb/A-Boo Peak",
    ],
    ready: () => have($item`A-Boo clue`),
    completed: () => get("booPeakProgress") === 0,
    prepare: () => {
      if (have($item`pec oil`)) ensureEffect($effect`Oiled-Up`);
      use($item`A-Boo clue`);
      fillHp();
    },
    do: $location`A-Boo Peak`,
    effects: $effects`Red Door Syndrome`,
    outfit: {
      modifier: "20 spooky res, 20 cold res, HP",
      familiar: $familiar`Exotic Parrot`,
      skipDefaults: true,
    },
    choices: { 611: 1 },
    limit: { tries: 5 },
    freeaction: true,
    expectbeatenup: true,
  },
  {
    name: "ABoo Peak",
    after: ["ABoo Clues", "ABoo Horror"],
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
    prepare: () => {
      if (myMp() < 80 && myMaxmp() >= 80) restoreMp(80 - myMp());
    },
    do: $location`Oil Peak`,
    outfit: () => {
      if (have($item`unbreakable umbrella`))
        return { modifier: "ML max 80, 0.1 item", equip: $items`unbreakable umbrella` };
      else return { modifier: "ML max 100, 0.1 item" };
    },
    combat: new CombatStrategy().killItem(),
    limit: { tries: 18 },
    orbtargets: undefined,
  },
  {
    name: "Oil Peak",
    after: ["Oil Kill"],
    completed: () => get("oilPeakLit"),
    do: $location`Oil Peak`,
    limit: { tries: 1 },
    orbtargets: undefined,
  },
  {
    name: "Oil Jar", // get oil for jar of oil
    after: ["Oil Peak"],
    completed: () =>
      itemAmount($item`bubblin' crude`) >= 12 ||
      have($item`jar of oil`) ||
      !!(get("twinPeakProgress") & 4),
    do: $location`Oil Peak`,
    outfit: () => {
      if (have($item`unbreakable umbrella`))
        return {
          modifier: "ML 80 max, 0.1 item, monster level percent",
          equip: $items`unbreakable umbrella`,
        };
      else return { modifier: "ML, 0.1 item" };
    },
    limit: { soft: 5 },
    orbtargets: undefined,
  },
];

const Twin: Task[] = [
  {
    name: "Twin Stench Search",
    after: ["Start Peaks", "Macguffin/Forest"], // Wait for black paint,
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 1),
    do: $location`Twin Peak`,
    choices: { 606: 1, 607: 1 },
    effects: $effects`Red Door Syndrome`,
    outfit: { modifier: "100 stench res 4min, -combat, item" },
    combat: new CombatStrategy().killItem(
      ...$monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Stench",
    after: ["Start Peaks"],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 1),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 1, 607: 1 },
    effects: $effects`Red Door Syndrome`,
    outfit: { modifier: "stench res 4min" },
    limit: { tries: 1 },
  },
  {
    name: "Twin Item Search",
    after: ["Start Peaks"],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 2),
    do: $location`Twin Peak`,
    choices: { 606: 2, 608: 1 },
    outfit: { modifier: "item 50min, -combat" },
    combat: new CombatStrategy().killItem(
      ...$monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Item",
    after: ["Start Peaks"],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 2),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 2, 608: 1 },
    outfit: { modifier: "item 50min" },
    limit: { tries: 1 },
  },
  {
    name: "Twin Oil Search",
    after: ["Start Peaks", "Oil Jar"],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 4),
    do: $location`Twin Peak`,
    choices: { 606: 3, 609: 1, 616: 1 },
    outfit: { modifier: "item, -combat" },
    combat: new CombatStrategy().killItem(
      ...$monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    acquire: [{ item: $item`jar of oil` }],
    limit: { soft: 10 },
  },
  {
    name: "Twin Oil",
    after: ["Start Peaks", "Oil Jar"],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 4),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 3, 609: 1, 616: 1 },
    acquire: [{ item: $item`jar of oil` }],
    limit: { tries: 1 },
  },
  {
    name: "Twin Init Search",
    after: [
      "Twin Stench",
      "Twin Item",
      "Twin Oil",
      "Twin Stench Search",
      "Twin Item Search",
      "Twin Oil Search",
    ],
    ready: () => !have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 8),
    do: $location`Twin Peak`,
    choices: { 606: 4, 610: 1, 1056: 1 },
    outfit: { modifier: "init 40 min, item, -combat" },
    combat: new CombatStrategy().killItem(
      ...$monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`
    ),
    limit: { soft: 10 },
  },
  {
    name: "Twin Init",
    after: [
      "Twin Stench",
      "Twin Item",
      "Twin Oil",
      "Twin Stench Search",
      "Twin Item Search",
      "Twin Oil Search",
    ],
    ready: () => have($item`rusty hedge trimmers`),
    completed: () => !!(get("twinPeakProgress") & 8),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 4, 610: 1, 1056: 1 },
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
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      freeaction: true,
    },
    {
      name: "Bridge",
      after: ["Start", "Macguffin/Forest"], // Wait for black paint
      ready: () =>
        ((have($item`frozen jeans`) ||
          have($skill`Cryocurrency`) ||
          have($skill`Cooling Tubules`) ||
          have($skill`Snow-Cooling System`)) &&
          get("smutOrcNoncombatProgress") < 15) ||
        ((have($effect`Red Door Syndrome`) || myMeat() >= 1000) && myBasestat($stat`Moxie`) >= 400),
      completed: () => step("questL09Topping") >= 1,
      prepare: () => {
        if (get("smutOrcNoncombatProgress") >= 15 && step("questL11Black") >= 2) {
          ensureEffect($effect`Red Door Syndrome`);
          ensureEffect($effect`Butt-Rock Hair`);
        }
      },
      do: $location`The Smut Orc Logging Camp`,
      post: (): void => {
        if (have($item`smut orc keepsake box`)) use($item`smut orc keepsake box`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
      },
      outfit: () => {
        if (get("smutOrcNoncombatProgress") < 15)
          return {
            modifier: "item",
            equip: $items`frozen jeans, Space Trip safety headphones, HOA regulation book`,
          };
        else return { modifier: "sleaze res", equip: $items`combat lover's locket` };
      },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()).ignore(),
      choices: { 1345: 3 },
      freeaction: () => get("smutOrcNoncombatProgress") >= 15,
      limit: { soft: 45 },
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
      after: ["ABoo Peak", "Oil Peak", "Twin Init", "Twin Init Search"],
      completed: () => step("questL09Topping") === 999,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
