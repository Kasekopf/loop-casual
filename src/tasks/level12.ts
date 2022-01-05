import { availableAmount, cliExecute, create, mallPrice, myLevel, use, visitUrl } from "kolmafia";
import { $item, $items, $location, get, have } from "libram";
import { CombatStrategy, Quest, step } from "./structure";

function ensureFluffers(flufferCount: number): void {
  // From bean-casual
  while (availableAmount($item`stuffing fluffer`) < flufferCount) {
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
  name: "War Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 12,
      completed: () => step("questL12War") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Unlock Island",
      completed: () =>
        have($item`dingy dinghy`) || have($item`junk junk`) || have($item`skeletal skiff`),
      do: (): void => {
        cliExecute("acquire skeletal skiff");
      },
      cap: 1,
    },
    {
      name: "Start War",
      after: ["Start", "Unlock Island"],
      completed: () => step("questL12War") >= 1,
      equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      do: $location`Hippy Camp`,
      modifier: "-combat",
      choices: { 142: 3, 1433: 3 },
    },
    {
      name: "Fluffers",
      after: "Start War",
      completed: () => get("hippiesDefeated") >= 1000,
      equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      do: (): void => {
        const count = clamp((1000 - get("hippiesDefeated")) / 46, 0, 24);
        ensureFluffers(count);
        while (get("hippiesDefeated") < 1000) {
          ensureFluffers(1);
          use($item`stuffing fluffer`);
        }
      },
      cap: 1,
    },
    {
      name: "Boss",
      after: "Fluffers",
      completed: () => step("questL12War") === 999,
      equip: $items`beer helmet, distressed denim pants, bejeweled pledge pin`,
      do: $location`Hippy Camp`,
      combat: new CombatStrategy().kill(),
      cap: 1,
    },
  ],
};
