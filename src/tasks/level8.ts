import { equippedAmount, Item, itemAmount, numericModifier, use, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  ensureEffect,
  get,
  have,
} from "libram";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { summonStrategy } from "./summons";
import { coldPlanner } from "../engine/outfit";
import { trainSetAvailable } from "./misc";

export const McLargeHugeQuest: Quest = {
  name: "McLargeHuge",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(8),
      completed: () => step("questL08Trapper") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Trapper Request",
      after: ["Start"],
      completed: () => step("questL08Trapper") >= 1,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      priority: () => Priorities.Free,
      freeaction: true,
    },
    {
      name: "Clover Ore",
      after: ["Trapper Request", "Pull/Ore", "Misc/Hermit Clover"],
      ready: () => have($item`11-leaf clover`),
      prepare: () => {
        if (!have($effect`Lucky!`)) use($item`11-leaf clover`);
      },
      completed: () =>
        itemAmount($item`asbestos ore`) >= 3 ||
        itemAmount($item`chrome ore`) >= 3 ||
        itemAmount($item`linoleum ore`) >= 3 ||
        step("questL08Trapper") >= 2 ||
        summonStrategy.getSourceFor($monster`mountain man`) !== undefined ||
        trainSetAvailable(),
      do: $location`Itznotyerzitz Mine`,
      limit: { tries: 2 },
    },
    {
      name: "Goatlet",
      after: ["Trapper Request"],
      completed: () => itemAmount($item`goat cheese`) >= 3 || step("questL08Trapper") >= 2,
      do: $location`The Goatlet`,
      outfit: { modifier: "item", avoid: $items`broken champagne bottle` },
      combat: new CombatStrategy()
        .killItem($monster`dairy goat`)
        .banish($monsters`drunk goat, sabre-toothed goat`),
      limit: { soft: 15 },
    },
    {
      name: "Trapper Return",
      after: ["Goatlet", "Pull/Ore", "Summon/Mountain Man", "Clover Ore"],
      ready: () => get("trapperOre") !== "" && itemAmount(Item.get(get("trapperOre"))) >= 3, // Checked here since there is no task for Trainset ores
      completed: () => step("questL08Trapper") >= 2,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Extreme Outfit",
      after: ["Trapper Return"],
      // eslint-disable-next-line libram/verify-constants
      completed: () =>
        haveHugeLarge() ||
        (have($item`eXtreme mittens`) &&
          have($item`snowboarder pants`) &&
          have($item`eXtreme scarf`)) ||
        step("questL08Trapper") >= 3,
      do: $location`The eXtreme Slope`,
      // eslint-disable-next-line libram/verify-constants
      outfit: { equip: $items`candy cane sword cane`, modifier: "item, -combat" },
      choices: {
        575: () =>
          // eslint-disable-next-line libram/verify-constants
          equippedAmount($item`candy cane sword cane`) > 0 &&
          (!have($item`snowboarder pants`) || !have($item`eXtreme mittens`))
            ? 5
            : 1,
        15: () => (have($item`eXtreme mittens`) ? 2 : 1),
        16: () => (have($item`snowboarder pants`) ? 2 : 1),
        17: () => (have($item`eXtreme mittens`) ? 2 : 1),
      },
      combat: new CombatStrategy().killItem(),
      limit: { soft: 30 },
    },
    {
      name: "Extreme Snowboard",
      after: ["Trapper Return", "Extreme Outfit"],
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
      after: ["Trapper Return", "Extreme Snowboard"],
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
      ready: () => coldPlanner.maximumPossible(true) >= 5,
      prepare: () => {
        if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("cold resistance") < 5)
          throw `Unable to ensure cold res for The Icy Peak`;
      },
      do: $location`Mist-Shrouded Peak`,
      outfit: () => coldPlanner.outfitFor(5),
      combat: new CombatStrategy().killHard(),
      boss: true,
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
