import { myLevel, visitUrl } from "kolmafia";
import { $item, $location, have } from "libram";
import { CombatStrategy, Quest, step } from "./structure";

export const McLargeHugeQuest: Quest = {
  name: "McLargeHuge Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 8,
      completed: () => step("questL08Trapper") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Ores",
      after: "Start",
      completed: () => step("questL08Trapper") >= 2,
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"); // request ore
        visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"); // provide
      },
      cap: 1,
    },
    {
      name: "Climb",
      after: "Ores",
      ready: () =>
        have($item`ninja rope`) && have($item`ninja carabiner`) && have($item`ninja crampons`),
      completed: () => step("questL08Trapper") >= 3,
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      modifier: "cold res min 5 max 5",
      cap: 1,
    },
    {
      name: "Peak",
      after: "Climb",
      completed: () => step("questL08Trapper") >= 5,
      do: $location`Mist-Shrouded Peak`,
      modifier: "cold res min 5 max 5",
      combat: new CombatStrategy().kill(),
      cap: 4,
    },
    {
      name: "Finish",
      after: ["Peak"],
      completed: () => step("questL08Trapper") === 999,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      cap: 1,
    },
  ],
};
