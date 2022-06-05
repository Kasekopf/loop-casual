import { cliExecute, itemAmount, myMeat, sell, visitUrl } from "kolmafia";
import {
  $coinmaster,
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest, step, Task } from "./structure";
import { OverridePriority } from "../priority";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

export function flyersDone(): boolean {
  return get("flyeredML") >= 10500;
}

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
    ready: () => flyersDone(), // Buffer for mafia tracking
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
  // Use CMG to replace a void monster into a Lobsterfrogman, then backup into the Boss Bat's lair
  {
    name: "Lighthouse",
    after: ["Enrage", "Bat/Use Sonar 3"],
    ready: () => get("cursedMagnifyingGlassCount") >= 13 && get("_voidFreeFights") < 5,
    completed: () =>
      get("lastCopyableMonster") === $monster`lobsterfrogman` ||
      itemAmount($item`barrel of gunpowder`) >= 5 ||
      get("sidequestLighthouseCompleted") !== "none" ||
      !have($item`cursed magnifying glass`) ||
      !have($item`Powerful Glove`) ||
      !have($item`backup camera`),
    do: $location`Sonofa Beach`,
    outfit: { equip: $items`cursed magnifying glass, Powerful Glove` },
    combat: new CombatStrategy()
      .macro(
        new Macro().trySkill($skill`CHEAT CODE: Replace Enemy`),
        ...$monsters`void guy, void slab, void spider`
      )
      .kill($monster`lobsterfrogman`),
    limit: { tries: 1 },
  },
  {
    name: "Lighthouse Basic",
    after: ["Enrage", "Lighthouse"],
    completed: () =>
      itemAmount($item`barrel of gunpowder`) >= 5 || get("sidequestLighthouseCompleted") !== "none",
    do: $location`Sonofa Beach`,
    outfit: {
      modifier: "+combat",
    },
    combat: new CombatStrategy().kill($monster`lobsterfrogman`),
    limit: { soft: 40 },
  },
  {
    name: "Lighthouse End",
    after: ["Lighthouse Basic"],
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
          .while_(
            "!match whips out && !times 28 && !hpbelow 30",
            new Macro().item($item`seal tooth`)
          )
          .if_("match whips out", new Macro().item(`molybdenum magnet`)),
        $monster`batwinged gremlin (tool)`
      )
      .banish($monster`A.M.C. gremlin`)
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
          .while_(
            "!match whips out && !times 28 && !hpbelow 30",
            new Macro().item($item`seal tooth`)
          )
          .if_("match whips out", new Macro().item(`molybdenum magnet`)),
        $monster`erudite gremlin (tool)`
      )
      .banish($monster`A.M.C. gremlin`)
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
          .while_(
            "!match whips out && !times 28 && !hpbelow 30",
            new Macro().item($item`seal tooth`)
          )
          .if_("match whips out", new Macro().item(`molybdenum magnet`)),
        $monster`spider gremlin (tool)`
      )
      .banish($monster`A.M.C. gremlin`)
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
          .while_(
            "!match whips out && !times 28 && !hpbelow 30",
            new Macro().item($item`seal tooth`)
          )
          .if_("match whips out", new Macro().item(`molybdenum magnet`)),
        $monster`vegetable gremlin (tool)`
      )
      .banish($monster`A.M.C. gremlin`)
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
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.BadMood : OverridePriority.YR,
    acquire: [
      { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
    ],
    do: $location`The Hatching Chamber`,
    outfit: () => {
      if (have($effect`Everything Looks Yellow`)) return { modifier: "item" };
      else return {};
    },
    combat: new CombatStrategy()
      .macro(new Macro().item($item`yellow rocket`), $monster`larval filthworm`)
      .killItem(),
    limit: { soft: 10 },
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
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.BadMood : OverridePriority.YR,
    acquire: [
      { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
    ],
    do: $location`The Feeding Chamber`,
    effects: $effects`Filthworm Larva Stench`,
    outfit: () => {
      if (have($effect`Everything Looks Yellow`)) return { modifier: "item" };
      else return {};
    },
    combat: new CombatStrategy()
      .macro(new Macro().item($item`yellow rocket`), $monster`filthworm drone`)
      .killItem(),
    limit: { soft: 10 },
  },
  {
    name: "Orchard Guard",
    after: ["Orchard Feeding"],
    completed: () =>
      have($item`filthworm royal guard scent gland`) ||
      have($effect`Filthworm Guard Stench`) ||
      have($item`heart of the filthworm queen`) ||
      get("sidequestOrchardCompleted") !== "none",
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.BadMood : OverridePriority.YR,
    acquire: [
      { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
    ],
    do: $location`The Royal Guard Chamber`,
    effects: $effects`Filthworm Drone Stench`,
    outfit: () => {
      if (have($effect`Everything Looks Yellow`)) return { modifier: "item" };
      else return {};
    },
    combat: new CombatStrategy()
      .macro(new Macro().item($item`yellow rocket`), $monster`filthworm royal guard`)
      .killItem(),
    limit: { soft: 10 },
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
    priority: () => (have($effect`Winklered`) ? OverridePriority.Effect : OverridePriority.None),
    prepare: () => {
      if (!get("concertVisited")) ensureEffect($effect`Winklered`);
    },
    do: $location`The Themthar Hills`,
    outfit: {
      modifier: "meat",
      equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin, amulet coin`, // Use amulet coin (if we have) to avoid using orb
    },
    freecombat: true, // Do not equip cmg or carn plant
    combat: new CombatStrategy(true).macro(new Macro().trySkill($skill`Bowl Straight Up`)).kill(),
    limit: { soft: 20 },
  },
];

export const WarQuest: Quest = {
  name: "War",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(12) && councilSafe(),
      completed: () => step("questL12War") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Outfit Hippy",
      after: ["Misc/Unlock Island"],
      completed: () =>
        (have($item`filthy corduroys`) && have($item`filthy knitted dread sack`)) ||
        have($item`Cargo Cultist Shorts`),
      ready: () =>
        !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
      priority: () =>
        have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
      acquire: [{ item: $item`yellow rocket` }],
      do: $location`Hippy Camp`,
      limit: { soft: 5 },
      outfit: { modifier: "+combat" },
      combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
    },
    {
      name: "Outfit Frat",
      after: ["Start", "Outfit Hippy"],
      completed: () =>
        (have($item`beer helmet`) &&
          have($item`distressed denim pants`) &&
          have($item`bejeweled pledge pin`)) ||
        have($item`Cargo Cultist Shorts`),
      ready: () =>
        !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
      priority: () =>
        have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
      acquire: [{ item: $item`yellow rocket` }],
      do: $location`Frat House`,
      limit: { soft: 5 },
      outfit: { equip: $items`filthy corduroys, filthy knitted dread sack`, modifier: "+combat" },
      combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
      choices: { 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 },
    },
    {
      name: "Outfit Frat Cargo",
      after: [],
      completed: () =>
        (have($item`beer helmet`) &&
          have($item`distressed denim pants`) &&
          have($item`bejeweled pledge pin`)) ||
        !have($item`Cargo Cultist Shorts`),
      ready: () =>
        !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
      priority: () =>
        have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
      acquire: [{ item: $item`yellow rocket` }],
      do: () => {
        cliExecute(`cargo 568`);
      },
      limit: { tries: 1 },
      combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
    },
    {
      name: "Enrage",
      after: ["Start", "Misc/Unlock Island", "Outfit Frat Cargo", "Outfit Frat"],
      completed: () => step("questL12War") >= 1,
      outfit: {
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
        modifier: "-combat",
      },
      do: $location`Wartime Hippy Camp (Frat Disguise)`,
      choices: { 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 },
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
      post: dimesForGarters,
      combat: new CombatStrategy().kill(),
      limit: { tries: 9 },
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
      post: dimesForGarters,
      combat: new CombatStrategy().kill(),
      limit: { tries: 26 },
    },
    {
      name: "Boss Hippie",
      after: ["Clear"],
      completed: () => step("questL12War") === 999,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      prepare: dimesForGarters,
      do: (): void => {
        visitUrl("bigisland.php?place=camp&whichcamp=1&confirm7=1");
        visitUrl("bigisland.php?action=bossfight&pwd");
      },
      combat: new CombatStrategy(true).killHard(),
      limit: { tries: 1 },
    },
  ],
};

export function councilSafe(): boolean {
  // Check if it is safe to visit the council without making the war outfit worse
  // (It is harder to get the hippy outfit after the war starts)
  return (
    !atLevel(12) ||
    (have($item`filthy corduroys`) && have($item`filthy knitted dread sack`)) ||
    (have($item`beer helmet`) &&
      have($item`distressed denim pants`) &&
      have($item`bejeweled pledge pin`))
  );
}

function dimesForGarters(): void {
  if (itemAmount($item`gauze garter`) >= 20) return;
  const to_sell = $items`pink clay bead, purple clay bead, green clay bead, communications windchimes, bullet-proof corduroys, round purple sunglasses, reinforced beaded headband`;
  for (const it of to_sell) {
    if (itemAmount(it) > 0) sell(it.buyer, itemAmount(it), it);
  }

  if ($coinmaster`Quartersmaster`.availableTokens >= 2) cliExecute("make * gauze garter");
}
