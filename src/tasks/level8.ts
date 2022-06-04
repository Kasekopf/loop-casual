import { cliExecute, itemAmount, myMaxhp, myMeat, restoreHp, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  CombatLoversLocket,
  have,
  Macro,
} from "libram";
import { Quest, step } from "./structure";
import { OverridePriority } from "../priority";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";

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
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      freeaction: true,
    },
    {
      name: "Trapper Request",
      after: ["Start"],
      completed: () => step("questL08Trapper") >= 1,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      priority: () => OverridePriority.Free,
      freeaction: true,
    },
    {
      name: "Goatlet",
      after: ["Trapper Request"],
      completed: () => itemAmount($item`goat cheese`) >= 3 || step("questL08Trapper") >= 2,
      do: $location`The Goatlet`,
      outfit: { modifier: "item" },
      combat: new CombatStrategy()
        .killItem($monster`dairy goat`)
        .banish(...$monsters`drunk goat, sabre-toothed goat`),
      limit: { soft: 15 },
    },
    {
      name: "Ore Mountain",
      after: [],
      completed: () => itemAmount($item`asbestos ore`) >= 2 || step("questL08Trapper") >= 2,
      ready: () =>
        !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
      priority: () =>
        have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
      acquire: [{ item: $item`yellow rocket` }],
      prepare: () => {
        cliExecute("retrocape heck hold");
      },
      do: () => {
        CombatLoversLocket.reminisce($monster`mountain man`);
      },
      outfit: { equip: $items`unwrapped knock-off retro superhero cape` },
      combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
      limit: { tries: 1 },
    },
    {
      name: "Trapper Return",
      after: ["Goatlet", "Pull/Ore", "Ore Mountain"],
      completed: () => step("questL08Trapper") >= 2,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Ninja",
      after: ["Trapper Return", "Misc/Summon Lion", "Palindome/Cold Snake"],
      completed: () =>
        (have($item`ninja rope`) && have($item`ninja carabiner`) && have($item`ninja crampons`)) ||
        step("questL08Trapper") >= 3,
      prepare: () => {
        restoreHp(myMaxhp());
      },
      do: $location`Lair of the Ninja Snowmen`,
      outfit: { modifier: "50 combat, init" },
      limit: { soft: 20 },
      combat: new CombatStrategy().killHard(
        $monster`Frozen Solid Snake`,
        $monster`ninja snowman assassin`
      ),
      orbtargets: () => [], // no assassins in orbs
      freeaction: true,
    },
    {
      name: "Climb",
      after: ["Trapper Return"],
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
      combat: new CombatStrategy(true).kill(),
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
