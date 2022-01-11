import { myLevel, use, visitUrl } from "kolmafia";
import { $item, $items, $location, $monster } from "libram";
import { Quest, step } from "./structure";
import { CombatStrategy } from "../combat";

export const BatQuest: Quest = {
  name: "Bat",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 4,
      completed: () => step("questL04Bat") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
      freeaction: true,
    },
    {
      name: "Use Sonar",
      after: ["Start"],
      acquire: $items`sonar-in-a-biscuit`,
      completed: () => step("questL04Bat") >= 3,
      do: () => use($item`sonar-in-a-biscuit`),
      cap: 3,
      freeaction: true,
    },
    {
      name: "Boss Bat",
      after: ["Use Sonar"],
      completed: () => step("questL04Bat") >= 4,
      do: $location`The Boss Bat's Lair`,
      combat: new CombatStrategy().kill($monster`Boss Bat`),
      cap: 7,
      delay: 4,
    },
    {
      name: "Finish",
      after: ["Boss Bat"],
      completed: () => step("questL04Bat") === 999,
      do: () => visitUrl("council.php"),
      cap: 1,
      freeaction: true,
    },
  ],
};
