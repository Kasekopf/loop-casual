import { myLevel, visitUrl } from "kolmafia";
import { $item, $items, $location, get, have } from "libram";
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
      name: "Extreme Snowboard",
      after: ["Ores"],
      acquire: [
        { item: $item`eXtreme mittens` },
        { item: $item`snowboarder pants` },
        { item: $item`eXtreme scarf` },
      ],
      completed: () => get("currentExtremity") >= 3 || step("questL08Trapper") >= 3,
      do: $location`The eXtreme Slope`,
      outfit: () => {
        if (haveHugeLarge())
          return {
            // eslint-disable-next-line libram/verify-constants
            equip: $items`McHugeLarge left pole, McHugeLarge right pole, McHugeLarge left ski, McHugeLarge right ski, McHugeLarge duffel bag`,
            modifier: "-combat",
          };
        return {
          equip: $items`eXtreme mittens, snowboarder pants, eXtreme scarf`,
          modifier: "-combat",
        };
      },
      limit: { soft: 30 },
    },
    {
      name: "Climb",
      after: ["Ores", "Extreme Snowboard"],
      completed: () => step("questL08Trapper") >= 3,
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      outfit: () => {
        if (haveHugeLarge())
          return {
            // eslint-disable-next-line libram/verify-constants
            equip: $items`McHugeLarge left pole, McHugeLarge right pole, McHugeLarge left ski, McHugeLarge right ski, McHugeLarge duffel bag`,
            modifier: "-combat",
          };
        return {
          equip: $items`eXtreme mittens, snowboarder pants, eXtreme scarf`,
          modifier: "-combat",
        };
      },
      limit: { tries: 1 },
      freeaction: true,
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

function haveHugeLarge() {
  return (
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge left pole`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge right pole`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge left ski`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge right ski`) &&
    // eslint-disable-next-line libram/verify-constants
    have($item`McHugeLarge duffel bag`)
  );
}
