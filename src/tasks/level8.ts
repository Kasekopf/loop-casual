import { myLevel, visitUrl } from "kolmafia";
import { $item, $location } from "libram";
import { Quest, step } from "./structure";
import { CombatStrategy } from "../combat";

export const McLargeHugeQuest: Quest = {
  name: "McLargeHuge",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 8,
      completed: () => step("questL08Trapper") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
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
      cap: 1,
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
      modifier: "cold res 5min",
      cap: 1,
    },
    {
      name: "Peak",
      after: ["Climb"],
      completed: () => step("questL08Trapper") >= 5,
      do: $location`Mist-Shrouded Peak`,
      modifier: "cold res 5min",
      combat: new CombatStrategy(true).kill(),
      cap: 4,
    },
    {
      name: "Finish",
      after: ["Peak"],
      completed: () => step("questL08Trapper") === 999,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      cap: 1,
      freeaction: true,
    },
  ],
};
