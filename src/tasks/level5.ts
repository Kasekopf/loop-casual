import { myLevel, use, visitUrl } from "kolmafia";
import { $item, $location, have } from "libram";
import { Quest, step } from "./structure";

export const MosquitoQuest: Quest = {
  name: "Knob Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 5,
      completed: () => have($item`Cobb's Knob map`),
      do: () => visitUrl("council.php"),
    },
    {
      name: "Outskirts",
      completed: () => have($item`Knob Goblin encryption key`),
      do: $location`The Outskirts of Cobb's Knob`,
    },
    {
      name: "Open Knob",
      after: ["Start", "Outskirts"],
      completed: () => !have($item`Cobb's Knob map`) && step("questL05Goblin") >= 0,
      do: () => use($item`Cobb's Knob map`),
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
    },
  ],
};
