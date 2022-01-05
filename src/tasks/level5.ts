import { myLevel, use, visitUrl } from "kolmafia";
import { $item, $location, $monster, have } from "libram";
import { CombatStrategy, Quest, step } from "./structure";

export const MosquitoQuest: Quest = {
  name: "Knob Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 5,
      completed: () => have($item`Cobb's Knob map`),
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Outskirts",
      completed: () => have($item`Knob Goblin encryption key`),
      do: $location`The Outskirts of Cobb's Knob`,
      choices: { 111: 3, 113: 2, 118: 1 },
      cap: 12, // TODO: Should be 11 if choice 118 counts for delay
    },
    {
      name: "Open Knob",
      after: ["Start", "Outskirts"],
      completed: () => !have($item`Cobb's Knob map`) && step("questL05Goblin") >= 0,
      do: () => use($item`Cobb's Knob map`),
      cap: 1,
    },
    {
      name: "King",
      after: "Open Knob",
      ready: () =>
        have($item`Knob Goblin harem veil`) &&
        have($item`Knob Goblin harem pants`) &&
        have($item`Knob Goblin perfume`),
      completed: () => step("questL05Goblin") === 999,
      do: $location`Throne Room`,
      combat: new CombatStrategy().kill($monster`Knob Goblin King`),
      cap: 1,
    },
  ],
};
