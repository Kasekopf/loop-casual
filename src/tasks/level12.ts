import { cliExecute, equippedAmount, itemAmount, sell, visitUrl } from "kolmafia";
import {
  $coinmaster,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { OverridePriority } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel, debug } from "../lib";
import { forceItemPossible, yellowRayPossible } from "../engine/resources";

export function flyersDone(): boolean {
  return get("flyeredML") >= 10000;
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
    priority: () => OverridePriority.Free,
    ready: () => flyersDone(), // Buffer for mafia tracking
    completed: () => get("sidequestArenaCompleted") !== "none",
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=concert&pwd");
      cliExecute("refresh inv");
      if (have($item`rock band flyers`)) {
        debug("Mafia tracking was incorrect for rock band flyers; continuing to flyer...");
        set(
          "_loopgyou_flyeredML_buffer",
          get("_loopgyou_flyeredML_buffer", 0) + (get("flyeredML") - 9900)
        );
        set("flyeredML", 9900);
      } else if (get("_loopgyou_flyeredML_buffer", 0) > 0) {
        debug(
          `Mafia tracking was incorrect for rock band flyers; quest completed at ${
            get("flyeredML") + get("_loopgyou_flyeredML_buffer", 0)
          }`
        );
      }
    },
    freeaction: true,
    limit: { soft: 10, message: "See https://kolmafia.us/threads/flyeredml-tracking-wrong.27567/" },
  },
];

const Lighthouse: Task[] = [
  // Saber into more lobsterfrogmen
  // Or backup into the Boss Bat's lair
  {
    name: "Lighthouse",
    after: ["Enrage"],
    ready: () => step("questL04Bat") >= 3 || have($item`Fourth of May Cosplay Saber`),
    completed: () =>
      itemAmount($item`barrel of gunpowder`) >= 5 ||
      get("sidequestLighthouseCompleted") !== "none" ||
      !have($item`backup camera`) ||
      !have($item`Fourth of May Cosplay Saber`),
    do: $location`Sonofa Beach`,
    outfit: (): OutfitSpec => {
      if (!have($item`Fourth of May Cosplay Saber`)) return { modifier: "+combat" };

      // Look for the first lobsterfrogman
      if (
        get("_saberForceMonster") !== $monster`lobsterfrogman` ||
        get("_saberForceMonsterCount") === 0
      ) {
        return { modifier: "+combat", equip: $items`Fourth of May Cosplay Saber` };
      }

      // Reuse the force to track more lobsterfrogman
      if (get("_saberForceMonsterCount") === 1 && itemAmount($item`barrel of gunpowder`) < 4) {
        return { equip: $items`Fourth of May Cosplay Saber` };
      }

      return {};
    },
    combat: new CombatStrategy()
      .macro(() => {
        if (
          equippedAmount($item`Fourth of May Cosplay Saber`) > 0 &&
          get("_saberForceUses") < 5 &&
          (get("_saberForceMonster") !== $monster`lobsterfrogman` ||
            get("_saberForceMonsterCount") === 0 ||
            (get("_saberForceMonsterCount") === 1 && itemAmount($item`barrel of gunpowder`) < 4))
        ) {
          return new Macro().skill($skill`Use the Force`);
        }
        return new Macro();
      })
      .kill($monster`lobsterfrogman`),
    choices: { 1387: 2 },
    limit: { tries: 20 },
  },
  {
    name: "Lighthouse Basic",
    after: ["Enrage", "Lighthouse"],
    completed: () =>
      itemAmount($item`barrel of gunpowder`) >= 5 || get("sidequestLighthouseCompleted") !== "none",
    do: $location`Sonofa Beach`,
    outfit: { modifier: "+combat" },
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
    limit: { soft: 15 },
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
    limit: { soft: 15 },
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
    limit: { soft: 15 },
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
    limit: { soft: 15 },
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
    outfit: () => {
      if (yellowRayPossible()) return {};
      else return { modifier: "item" };
    },
    combat: new CombatStrategy().yellowRay($monster`larval filthworm`),
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
    do: $location`The Feeding Chamber`,
    outfit: () => {
      if (forceItemPossible()) return {};
      else return { modifier: "item" };
    },
    combat: new CombatStrategy().forceItems($monster`filthworm drone`),
    effects: $effects`Filthworm Larva Stench`,
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
    do: $location`The Royal Guard Chamber`,
    effects: $effects`Filthworm Drone Stench`,
    outfit: () => {
      if (forceItemPossible()) return {};
      else return { modifier: "item" };
    },
    combat: new CombatStrategy().forceItems($monster`filthworm royal guard`),
    limit: { soft: 10 },
  },
  {
    name: "Orchard Queen",
    after: ["Orchard Guard"],
    completed: () =>
      have($item`heart of the filthworm queen`) || get("sidequestOrchardCompleted") !== "none",
    do: $location`The Filthworm Queen's Chamber`,
    effects: $effects`Filthworm Guard Stench`,
    combat: new CombatStrategy().kill(),
    limit: { tries: 2 }, // allow wanderer
    boss: true,
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
      if (have($item`SongBoom™ BoomBox`) && get("boomBoxSong") !== "Total Eclipse of Your Meat")
        cliExecute("boombox meat");
      if (!get("concertVisited")) ensureEffect($effect`Winklered`);
    },
    do: $location`The Themthar Hills`,
    outfit: () => {
      if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l pirate costume`)) {
        return {
          modifier: "meat",
          familiar: $familiar`Trick-or-Treating Tot`,
          equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin, li'l pirate costume`,
        };
      }
      return {
        modifier: "meat",
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin, amulet coin`, // Use amulet coin (if we have) to avoid using orb
      };
    },
    freecombat: true, // Do not equip cmg or carn plant
    combat: new CombatStrategy()
      .macro(new Macro().trySkill($skill`Bowl Straight Up`).trySkill($skill`Sing Along`))
      .kill(),
    limit: { soft: 25 },
    boss: true,
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
      completed: () => have($item`filthy corduroys`) && have($item`filthy knitted dread sack`),
      do: $location`Hippy Camp`,
      limit: { soft: 10 },
      choices: {
        136: () => (have($item`filthy corduroys`) ? 2 : 1),
        137: () => (have($item`filthy corduroys`) ? 1 : 2),
      },
      outfit: () => {
        if (yellowRayPossible()) return { modifier: "+combat" };
        else return { modifier: "item" };
      },
      combat: new CombatStrategy().yellowRay(),
    },
    {
      name: "Outfit Frat",
      after: ["Start", "Outfit Hippy"],
      completed: () =>
        have($item`beer helmet`) &&
        have($item`distressed denim pants`) &&
        have($item`bejeweled pledge pin`),
      do: $location`Frat House`,
      limit: { soft: 10 },
      choices: { 142: 3, 143: 3, 144: 3, 145: 1, 146: 3, 1433: 3 },
      outfit: () => {
        if (yellowRayPossible())
          return {
            equip: $items`filthy corduroys, filthy knitted dread sack`,
            modifier: "+combat",
          };
        else
          return { equip: $items`filthy corduroys, filthy knitted dread sack`, modifier: "item" };
      },
      combat: new CombatStrategy().yellowRay(),
    },
    {
      name: "Enrage",
      after: ["Start", "Misc/Unlock Island", "Outfit Frat"],
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
      limit: { tries: 10 },
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
      limit: { tries: 9 },
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
      limit: { tries: 30 },
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
      combat: new CombatStrategy().killHard(),
      limit: { tries: 1 },
      boss: true,
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
