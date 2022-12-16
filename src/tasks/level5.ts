import { myLevel, use, visitUrl } from "kolmafia";
import { $effects, $item, $location, $monster, have } from "libram";
import { Quest } from "../engine/task";
import { CombatStrategy } from "../engine/combat";
import { step } from "grimoire-kolmafia";

export const KnobQuest: Quest = {
  name: "Knob",
  tasks: [
    {
      name: "Start",
      after: ["Toot/Finish"],
      ready: () => myLevel() >= 5,
      completed: () => step("questL05Goblin") >= 0,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Outskirts",
      after: [],
      completed: () => have($item`Knob Goblin encryption key`) || step("questL05Goblin") > 0,
      do: $location`The Outskirts of Cobb's Knob`,
      choices: { 111: 3, 113: 2, 118: 1 },
      limit: { tries: 13 },
      delay: 10,
    },
    {
      name: "Open Knob",
      after: ["Start", "Outskirts"],
      completed: () => step("questL05Goblin") >= 1,
      do: () => use($item`Cobb's Knob map`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "King",
      after: ["Open Knob"],
      acquire: [
        { item: $item`Knob Goblin harem veil` },
        { item: $item`Knob Goblin harem pants` },
        { item: $item`Knob Goblin perfume` },
      ],
      completed: () => step("questL05Goblin") === 999,
      do: $location`Throne Room`,
      boss: true,
      combat: new CombatStrategy().kill($monster`Knob Goblin King`),
      effects: $effects`Knob Goblin Perfume`,
      limit: { tries: 1 },
    },
  ],
};
