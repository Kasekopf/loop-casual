import {
  availableAmount,
  cliExecute,
  council,
  create,
  equippedAmount,
  Item,
  itemAmount,
  mallPrice,
  myLevel,
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
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
  set,
} from "libram";
import { Quest, Task } from "../engine/task";
import { CombatStrategy } from "../engine/combat";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { args } from "../main";
import { debug } from "../lib";

function ensureFluffers(flufferCount: number): void {
  // From bean-casual
  while (availableAmount($item`stuffing fluffer`) < flufferCount) {
    if (itemAmount($item`cashew`) >= 3) {
      create(1, $item`stuffing fluffer`);
      continue;
    }
    const neededFluffers = flufferCount - availableAmount($item`stuffing fluffer`);
    const stuffingFlufferSources: [Item, number][] = [
      [$item`cashew`, 3],
      [$item`stuffing fluffer`, 1],
      [$item`cornucopia`, (1 / 3.5) * 3],
    ];
    stuffingFlufferSources.sort(
      ([item1, mult1], [item2, mult2]) => mallPrice(item1) * mult1 - mallPrice(item2) * mult2
    );
    const [stuffingFlufferSource, sourceMultiplier] = stuffingFlufferSources[0];

    const neededOfSource = Math.ceil(neededFluffers * sourceMultiplier);
    cliExecute(`acquire ${neededOfSource} ${stuffingFlufferSource}`);
    if (itemAmount(stuffingFlufferSource) < neededOfSource) {
      throw `Unable to acquire ${stuffingFlufferSource}; maybe raising your pricing limit will help?`;
    }
    if (stuffingFlufferSource === $item`cornucopia`) {
      use(neededOfSource, $item`cornucopia`);
    }
    if (stuffingFlufferSource !== $item`stuffing fluffer`) {
      create(
        clamp(Math.floor(availableAmount($item`cashew`) / 3), 0, neededFluffers),
        $item`stuffing fluffer`
      );
    }
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export function flyersDone(): boolean {
  return get("flyeredML") >= 10000;
}

const Flyers: Task[] = [
  {
    name: "Flyers Start",
    after: ["Enrage"],
    completed: () =>
      have($item`rock band flyers`) || get("sidequestArenaCompleted") !== "none" || args.fluffers,
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
    priority: () => true,
    ready: () => flyersDone(), // Buffer for mafia tracking
    completed: () => get("sidequestArenaCompleted") !== "none" || args.fluffers,
    outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
    do: (): void => {
      visitUrl("bigisland.php?place=concert&pwd");
      cliExecute("refresh inv");
      if (have($item`rock band flyers`)) {
        debug("Mafia tracking was incorrect for rock band flyers; continuing to flyer...");
        set(
          "_loopcasual_flyeredML_buffer",
          get("_loopcasual_flyeredML_buffer", 0) + (get("flyeredML") - 9900)
        );
        set("flyeredML", 9900);
      } else if (get("_loopcasual_flyeredML_buffer", 0) > 0) {
        debug(
          `Mafia tracking was incorrect for rock band flyers; quest completed at ${
            get("flyeredML") + get("_loopcasual_flyeredML_buffer", 0)
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
  {
    name: "Lighthouse",
    after: ["Enrage"],
    completed: () =>
      itemAmount($item`barrel of gunpowder`) >= 5 ||
      get("sidequestLighthouseCompleted") !== "none" ||
      !have($item`Fourth of May Cosplay Saber`) ||
      args.fluffers,
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
      itemAmount($item`barrel of gunpowder`) >= 5 ||
      get("sidequestLighthouseCompleted") !== "none" ||
      args.fluffers,
    do: $location`Sonofa Beach`,
    outfit: { modifier: "+combat" },
    combat: new CombatStrategy().kill($monster`lobsterfrogman`),
    limit: { soft: 40 },
  },
  {
    name: "Lighthouse End",
    after: ["Lighthouse Basic"],
    completed: () => get("sidequestLighthouseCompleted") !== "none" || args.fluffers,
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
    completed: () =>
      have($item`molybdenum magnet`) ||
      get("sidequestJunkyardCompleted") !== "none" ||
      args.fluffers,
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
    completed: () =>
      have($item`molybdenum hammer`) ||
      get("sidequestJunkyardCompleted") !== "none" ||
      args.fluffers,
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
      .banish($monsters`A.M.C. gremlin, batwinged gremlin, vegetable gremlin`)
      .kill($monster`batwinged gremlin (tool)`),
    limit: { soft: 15 },
  },
  {
    name: "Junkyard Wrench",
    after: ["Junkyard Start"],
    completed: () =>
      have($item`molybdenum crescent wrench`) ||
      get("sidequestJunkyardCompleted") !== "none" ||
      args.fluffers,
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
      .banish($monsters`A.M.C. gremlin, erudite gremlin, spider gremlin`)
      .kill($monster`erudite gremlin (tool)`),
    limit: { soft: 15 },
  },
  {
    name: "Junkyard Pliers",
    after: ["Junkyard Start"],
    acquire: [{ item: $item`seal tooth` }],
    completed: () =>
      have($item`molybdenum pliers`) ||
      get("sidequestJunkyardCompleted") !== "none" ||
      args.fluffers,
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
      .banish($monsters`A.M.C. gremlin, batwinged gremlin, spider gremlin`)
      .kill($monster`spider gremlin (tool)`),
    limit: { soft: 15 },
  },
  {
    name: "Junkyard Screwdriver",
    after: ["Junkyard Start"],
    completed: () =>
      have($item`molybdenum screwdriver`) ||
      get("sidequestJunkyardCompleted") !== "none" ||
      args.fluffers,
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
      .banish($monsters`A.M.C. gremlin, erudite gremlin, vegetable gremlin`)
      .kill($monster`vegetable gremlin (tool)`),
    limit: { soft: 15 },
  },
  {
    name: "Junkyard End",
    after: ["Junkyard Hammer", "Junkyard Wrench", "Junkyard Pliers", "Junkyard Screwdriver"],
    completed: () => get("sidequestJunkyardCompleted") !== "none" || args.fluffers,
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
      get("sidequestOrchardCompleted") !== "none" ||
      args.fluffers,
    do: $location`The Hatching Chamber`,
    outfit: () => {
      if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
        return { equip: $items`industrial fire extinguisher` };
      if (have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5)
        return { equip: $items`Fourth of May Cosplay Saber` };
      else return { modifier: "item" };
    },
    combat: new CombatStrategy()
      .macro(
        Macro.trySkill($skill`Use the Force`).trySkill($skill`Fire Extinguisher: Polar Vortex`),
        $monster`larval filthworm`
      )
      .kill(),
    choices: { 1387: 3 },
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
      get("sidequestOrchardCompleted") !== "none" ||
      args.fluffers,
    do: $location`The Feeding Chamber`,
    outfit: () => {
      if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
        return { equip: $items`industrial fire extinguisher` };
      if (have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5)
        return { equip: $items`Fourth of May Cosplay Saber` };
      else return { modifier: "item" };
    },
    combat: new CombatStrategy()
      .macro(
        Macro.trySkill($skill`Use the Force`).trySkill($skill`Fire Extinguisher: Polar Vortex`),
        $monster`filthworm drone`
      )
      .kill(),
    choices: { 1387: 3 },
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
      get("sidequestOrchardCompleted") !== "none" ||
      args.fluffers,
    do: $location`The Royal Guard Chamber`,
    effects: $effects`Filthworm Drone Stench`,
    outfit: () => {
      if (have($item`industrial fire extinguisher`) && get("_fireExtinguisherCharge") >= 10)
        return { equip: $items`industrial fire extinguisher` };
      if (have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5)
        return { equip: $items`Fourth of May Cosplay Saber` };
      else return { modifier: "item" };
    },
    combat: new CombatStrategy()
      .macro(
        Macro.trySkill($skill`Use the Force`).trySkill($skill`Fire Extinguisher: Polar Vortex`),
        $monster`filthworm royal guard`
      )
      .kill(),
    choices: { 1387: 3 },
    limit: { soft: 10 },
  },
  {
    name: "Orchard Queen",
    after: ["Orchard Guard"],
    completed: () =>
      have($item`heart of the filthworm queen`) ||
      get("sidequestOrchardCompleted") !== "none" ||
      args.fluffers,
    do: $location`The Filthworm Queen's Chamber`,
    effects: $effects`Filthworm Guard Stench`,
    combat: new CombatStrategy().kill(),
    limit: { tries: 2 }, // allow wanderer
    boss: true,
  },
  {
    name: "Orchard Finish",
    after: ["Orchard Queen", "Open Orchard"],
    completed: () => get("sidequestOrchardCompleted") !== "none" || args.fluffers,
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
    completed: () => get("sidequestNunsCompleted") !== "none" || args.fluffers,
    priority: () => (have($effect`Winklered`) ? true : false),
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
      ready: () => myLevel() >= 12,
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
    {
      name: "Fluffers",
      after: ["Enrage"],
      completed: () =>
        get("hippiesDefeated") >= 1000 || get("fratboysDefeated") >= 1000 || !args.fluffers,
      outfit: {
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      },
      do: (): void => {
        // const count = clamp((1000 - get("hippiesDefeated")) / 46, 0, 24);
        while (get("hippiesDefeated") < 1000) {
          ensureFluffers(1);
          use($item`stuffing fluffer`);
        }
      },
      limit: { tries: 1 },
      freeaction: true,
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
      completed: () => get("hippiesDefeated") >= 64 || args.fluffers,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: $location`The Battlefield (Frat Uniform)`,
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
      completed: () => get("hippiesDefeated") >= 192 || args.fluffers,
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
      completed: () => get("hippiesDefeated") >= 1000 || args.fluffers,
      outfit: { equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin` },
      do: $location`The Battlefield (Frat Uniform)`,
      combat: new CombatStrategy().kill(),
      limit: { tries: 30 },
    },
    // Kill whichever side the fluffers finish off first
    {
      name: "Boss Hippie",
      after: ["Fluffers", "Clear"],
      completed: () => step("questL12War") === 999,
      ready: () => get("hippiesDefeated") >= 1000,
      outfit: {
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      },
      do: (): void => {
        visitUrl("bigisland.php?place=camp&whichcamp=1&confirm7=1");
        visitUrl("bigisland.php?action=bossfight&pwd");
        visitUrl("main.php");
      },
      post: council,
      boss: true,
      combat: new CombatStrategy().killHard(),
      limit: { tries: 1 },
    },
    {
      name: "Boss Frat",
      after: ["Fluffers", "Clear"],
      completed: () => step("questL12War") === 999,
      ready: () => get("fratboysDefeated") >= 1000,
      acquire: [
        { item: $item`reinforced beaded headband` },
        { item: $item`bullet-proof corduroys` },
        { item: $item`round purple sunglasses` },
      ],
      outfit: {
        equip: $items`reinforced beaded headband, bullet-proof corduroys, round purple sunglasses`,
      },
      do: (): void => {
        visitUrl("bigisland.php?place=camp&whichcamp=2&confirm7=1");
        visitUrl("bigisland.php?action=bossfight&pwd");
        visitUrl("main.php");
      },
      post: council,
      boss: true,
      combat: new CombatStrategy().killHard(),
      limit: { tries: 1 },
    },
  ],
};
