import {
  availableAmount,
  cliExecute,
  create,
  Item,
  itemAmount,
  mallPrice,
  myLevel,
  use,
  visitUrl,
} from "kolmafia";
import { $item, $items, $location, get } from "libram";
import { Quest, step } from "./structure";
import { CombatStrategy } from "../combat";

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
      completed: () => get("hippiesDefeated") >= 1000 || get("fratboysDefeated") >= 1000,
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
    // Kill whichever side the fluffers finish off first
    {
      name: "Boss Hippie",
      after: ["Fluffers"],
      completed: () => step("questL12War") === 999,
      ready: () => get("hippiesDefeated") >= 1000,
      outfit: {
        equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      },
      do: (): void => {
        visitUrl("bigisland.php?place=camp&whichcamp=1&confirm7=1");
        visitUrl("bigisland.php?action=bossfight&pwd");
      },
      combat: new CombatStrategy(true).killHard(),
      limit: { tries: 1 },
    },
    {
      name: "Boss Frat",
      after: ["Fluffers"],
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
      },
      combat: new CombatStrategy(true).killHard(),
      limit: { tries: 1 },
    },
  ],
};
