import { itemAmount, visitUrl } from "kolmafia";
import { $effect, $effects, $item, $items, $location, $monster, get, have, Macro } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

const Flyers: Task[] = [
  {
    name: "Flyers Start",
    after: ["Enrage"],
    completed: () => have($item`rock band flyers`) || get("sidequestArenaCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=concert&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Flyers End",
    after: ["Flyers Start"],
    ready: () => get("flyeredML") >= 10000,
    completed: () => get("sidequestArenaCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=concert&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
];

const Lighthouse: Task[] = [
  {
    name: "Lighthouse",
    after: ["Enrage"],
    completed: () =>
      itemAmount($item`barrel of gunpowder`) >= 5 || get("sidequestLighthouseCompleted") !== "none",
    do: $location`Sonofa Beach`,
    outfit: { modifier: "+combat" },
    limit: { soft: 20 },
  },
  {
    name: "Lighthouse End",
    after: ["Lighthouse"],
    completed: () => get("sidequestLighthouseCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=lighthouse&action=pyro&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
];

const Junkyard: Task[] = [
  {
    name: "Junkyard Start",
    after: ["Enrage"],
    completed: () => have($item`molybdenum magnet`) || get("sidequestJunkyardCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?action=junkman&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
  {
    name: "Junkyard Hammer",
    after: ["Junkyard Start"],
    completed: () => have($item`molybdenum hammer`) || get("sidequestJunkyardCompleted") !== "none",
    acquire: [{ item: $item`seal tooth` }],
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: $location`Next to that Barrel with Something Burning in it`,
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .while_("!match whips out", new Macro().item($item`seal tooth`))
          .item($item`molybdenum magnet`),
        $monster`batwinged gremlin (tool)`
      )
      .kill($monster`batwinged gremlin (tool)`),
    limit: { soft: 10 },
  },
  {
    name: "Junkyard Wrench",
    after: ["Junkyard Start"],
    completed: () =>
      have($item`molybdenum crescent wrench`) || get("sidequestJunkyardCompleted") !== "none",
    acquire: [{ item: $item`seal tooth` }],
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: $location`Over Where the Old Tires Are`,
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .while_("!match whips out", new Macro().item($item`seal tooth`))
          .item($item`molybdenum magnet`),
        $monster`erudite gremlin (tool)`
      )
      .kill($monster`erudite gremlin (tool)`),
    limit: { soft: 10 },
  },
  {
    name: "Junkyard Pliers",
    after: ["Junkyard Start"],
    acquire: [{ item: $item`seal tooth` }],
    completed: () => have($item`molybdenum pliers`) || get("sidequestJunkyardCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: $location`Near an Abandoned Refrigerator`,
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .while_("!match whips out", new Macro().item($item`seal tooth`))
          .item($item`molybdenum magnet`),
        $monster`spider gremlin (tool)`
      )
      .kill($monster`spider gremlin (tool)`),
    limit: { soft: 10 },
  },
  {
    name: "Junkyard Screwdriver",
    after: ["Junkyard Start"],
    completed: () =>
      have($item`molybdenum screwdriver`) || get("sidequestJunkyardCompleted") !== "none",
    acquire: [{ item: $item`seal tooth` }],
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: $location`Out by that Rusted-Out Car`,
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .while_("!match whips out", new Macro().item($item`seal tooth`))
          .item($item`molybdenum magnet`),
        $monster`vegetable gremlin (tool)`
      )
      .kill($monster`vegetable gremlin (tool)`),
    limit: { soft: 10 },
  },
  {
    name: "Junkyard End",
    after: ["Junkyard Hammer", "Junkyard Wrench", "Junkyard Pliers", "Junkyard Screwdriver"],
    completed: () => get("sidequestJunkyardCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?action=junkman&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
];

const Orchard: Task[] = [
  {
    name: "Orchard Hatching",
    after: ["Enrage"],
    completed: () =>
      have($item`filthworm hatchling scent gland`) ||
      have($effect`Filthworm Larva Stench`) ||
      have($item`filthworm drone scent gland`) ||
      have($effect`Filthworm Drone Stench`) ||
      have($item`filthworm royal guard scent gland`) ||
      have($effect`Filthworm Guard Stench`) ||
      have($item`heart of the filthworm queen`) ||
      get("sidequestOrchardCompleted") !== "none",
    do: $location`The Hatching Chamber`,
    outfit: { modifier: "items" },
    combat: new CombatStrategy().kill(),
    limit: { soft: 15 },
  },
  {
    name: "Orchard Feeding",
    after: ["Orchard Hatching"],
    completed: () =>
      have($item`filthworm drone scent gland`) ||
      have($effect`Filthworm Drone Stench`) ||
      have($item`filthworm royal guard scent gland`) ||
      have($effect`Filthworm Guard Stench`) ||
      have($item`heart of the filthworm queen`) ||
      get("sidequestOrchardCompleted") !== "none",
    do: $location`The Feeding Chamber`,
    outfit: { modifier: "items" },
    effects: $effects`Filthworm Larva Stench`,
    combat: new CombatStrategy().kill(),
    limit: { tries: 10 },
  },
  {
    name: "Orchard Guard",
    after: ["Orchard Feeding"],
    completed: () =>
      have($item`filthworm royal guard scent gland`) ||
      have($effect`Filthworm Guard Stench`) ||
      have($item`heart of the filthworm queen`) ||
      get("sidequestOrchardCompleted") !== "none",
    do: $location`The Royal Guard Chamber`,
    outfit: { modifier: "items" },
    effects: $effects`Filthworm Drone Stench`,
    combat: new CombatStrategy().kill(),
    limit: { tries: 10 },
  },
  {
    name: "Orchard Queen",
    after: ["Orchard Guard"],
    completed: () =>
      have($item`heart of the filthworm queen`) || get("sidequestOrchardCompleted") !== "none",
    do: $location`The Filthworm Queen's Chamber`,
    outfit: { modifier: "items" },
    effects: $effects`Filthworm Guard Stench`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
  {
    name: "Orchard Finish",
    after: ["Orchard Queen", "Open Orchard"],
    completed: () => get("sidequestOrchardCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=orchard&action=stand&pwd");
    },
    freeaction: true,
    limit: { tries: 1 },
  },
];

const Nuns: Task[] = [
  {
    name: "Nuns",
    after: ["Open Nuns"],
    completed: () => get("sidequestNunsCompleted") !== "none",
    do: $location`The Themthar Hills`,
    outfit: {
      modifier: "meat",
      equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
    },
    combat: new CombatStrategy(true).kill(),
    limit: { soft: 20 },
  },
];

export const WarQuest: Quest = {
  name: "War",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(12),
      completed: () => step("questL12War") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Enrage",
      after: ["Start", "Misc/Unlock Island"],
      acquire: [
        { item: $item`beer helmet` },
        { item: $item`distressed denim pants` },
        { item: $item`bejeweled pledge pin` },
      ],
      completed: () => step("questL12War") >= 1,
      outfit: {
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
        modifier: "-combat",
      },
      do: $location`Hippy Camp`,
      choices: { 142: 3, 1433: 3 },
      limit: { soft: 20 },
    },
    ...Flyers,
    ...Lighthouse,
    ...Junkyard,
    {
      name: "Open Orchard",
      after: ["Flyers End", "Lighthouse End", "Junkyard End"],
      acquire: [
        { item: $item`beer helmet` },
        { item: $item`distressed denim pants` },
        { item: $item`bejeweled pledge pin` },
      ],
      completed: () => get("hippiesDefeated") >= 64,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: $location`The Battlefield (Frat Uniform)`,
      combat: new CombatStrategy().kill(),
      limit: { tries: 8 },
    },
    ...Orchard,
    {
      name: "Open Nuns",
      after: ["Orchard Finish"],
      acquire: [
        { item: $item`beer helmet` },
        { item: $item`distressed denim pants` },
        { item: $item`bejeweled pledge pin` },
      ],
      completed: () => get("hippiesDefeated") >= 192,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: $location`The Battlefield (Frat Uniform)`,
      combat: new CombatStrategy().kill(),
      limit: { tries: 8 },
    },
    ...Nuns,
    {
      name: "Clear",
      after: ["Nuns"],
      acquire: [
        { item: $item`beer helmet` },
        { item: $item`distressed denim pants` },
        { item: $item`bejeweled pledge pin` },
      ],
      completed: () => get("hippiesDefeated") >= 1000,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: $location`The Battlefield (Frat Uniform)`,
      combat: new CombatStrategy().kill(),
      limit: { tries: 26 },
    },
    {
      name: "Boss Hippie",
      after: ["Clear"],
      completed: () => step("questL12War") === 999,
      ready: () => get("hippiesDefeated") >= 1000,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: (): void => {
        visitUrl("bigisland.php?place=camp&whichcamp=1&confirm7=1");
        visitUrl("bigisland.php?action=bossfight&pwd");
      },
      combat: new CombatStrategy(true).killHard(),
      limit: { tries: 1 },
    },
  ],
};
