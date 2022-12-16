import { myLevel, visitUrl } from "kolmafia";
import { $item, $location } from "libram";
import { Quest } from "../engine/task";
import { CombatStrategy } from "../engine/combat";
import { step } from "grimoire-kolmafia";

export const McLargeHugeQuest: Quest = {
  name: "McLargeHuge",
  tasks: [
    {
      name: "Start",
      after: ["Toot/Finish"],
      ready: () => myLevel() >= 8,
      completed: () => step("questL08Trapper") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Ores",
      after: ["Start"],
      acquire: [
        { item: $item`asbestos ore`, num: 3 },
        { item: $item`chrome ore`, num: 3 },
        { item: $item`linoleum ore`, num: 3 },
        { item: $item`goat cheese`, num: 3 },
      ],
      completed: () => step("questL08Trapper") >= 2,
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"); // request ore
        visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"); // provide
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Climb",
      after: ["Ores"],
      acquire: [
        { item: $item`ninja rope` },
        { item: $item`ninja carabiner` },
        { item: $item`ninja crampons` },
      ],
      completed: () => step("questL08Trapper") >= 3,
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      outfit: { modifier: "cold res 5min" },
      limit: { tries: 1 },
    },
    {
      name: "Peak",
      after: ["Climb"],
      completed: () => step("questL08Trapper") >= 5,
      do: $location`Mist-Shrouded Peak`,
      outfit: { modifier: "cold res 5min" },
      boss: true,
      combat: new CombatStrategy().kill(),
      limit: { tries: 4 },
    },
    {
      name: "Finish",
      after: ["Peak"],
      completed: () => step("questL08Trapper") === 999,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
