import { itemAmount, numericModifier, use, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  ensureEffect,
  have,
} from "libram";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { OverridePriority } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { fillHp } from "./level13";
import { summonStrategy } from "./summons";
import { coldRes } from "./absorb";

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
      name: "Clover Ore",
      after: ["Trapper Request", "Pull/Ore", "Misc/Hermit Clover"],
      ready: () => have($item`11-leaf clover`),
      prepare: () => {
        if (!have($effect`Lucky!`))
          use($item`11-leaf clover`);
      },
      completed: () =>
        itemAmount($item`asbestos ore`) >= 3 ||
        itemAmount($item`chrome ore`) >= 3 ||
        itemAmount($item`linoleum ore`) >= 3 ||
        step("questL08Trapper") >= 2 ||
        summonStrategy.getSourceFor($monster`mountain man`) !== undefined,
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
        .banish(...$monsters`drunk goat, sabre-toothed goat`),
      limit: { soft: 15 },
    },
    {
      name: "Trapper Return",
      after: ["Goatlet", "Pull/Ore", "Summon/Mountain Man", "Clover Ore"],
      completed: () => step("questL08Trapper") >= 2,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Ninja",
      after: ["Trapper Return", "Summon/White Lion", "Palindome/Cold Snake"],
      completed: () =>
        (have($item`ninja rope`) && have($item`ninja carabiner`) && have($item`ninja crampons`)) ||
        step("questL08Trapper") >= 3,
      prepare: () => {
        fillHp();
      },
      do: $location`Lair of the Ninja Snowmen`,
      outfit: { modifier: "50 combat, init" },
      limit: { soft: 20 },
      combat: new CombatStrategy().killHard([
        $monster`Frozen Solid Snake`,
        $monster`ninja snowman assassin`
      ]),
      orbtargets: () => [], // no assassins in orbs
    },
    {
      name: "Climb",
      after: ["Trapper Return", "Ninja"],
      completed: () => step("questL08Trapper") >= 3,
      ready: () => coldRes(true) >= 5,
      prepare: () => {
        if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("cold resistance") < 5) throw `Unable to ensure cold res for The Icy Peak`;
      },
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      outfit: { modifier: "cold res" },
      limit: { tries: 1 },
    },
    {
      name: "Peak",
      after: ["Climb"],
      completed: () => step("questL08Trapper") >= 5,
      ready: () => coldRes(true) >= 5,
      prepare: () => {
        if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("cold resistance") < 5) throw `Unable to ensure cold res for The Icy Peak`;
      },
      do: $location`Mist-Shrouded Peak`,
      outfit: { modifier: "cold res" },
      combat: new CombatStrategy().kill(),
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
