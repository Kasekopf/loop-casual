import { Item, itemAmount, numericModifier, use, visitUrl } from "kolmafia";
import {
  $effect,
  $familiar,
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
import { OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { fillHp } from "./level13";
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
      name: "Ninja",
      after: ["Trapper Return", "Summon/White Lion", "Palindome/Cold Snake"],
      completed: () =>
        (have($item`ninja rope`) && have($item`ninja carabiner`) && have($item`ninja crampons`)) ||
        step("questL08Trapper") >= 3,
      prepare: () => {
        fillHp();
      },
      do: $location`Lair of the Ninja Snowmen`,
      outfit: () => {
        const spec: OutfitSpec = { modifier: "50 combat, init", skipDefaults: true };
        if (have($familiar`Trick-or-Treating Tot`) && !have($item`li'l ninja costume`))
          spec.familiar = $familiar`Trick-or-Treating Tot`;
        if (
          have($item`latte lovers member's mug`) &&
          get("latteModifier").includes("Combat Rate: 10")
        ) {
          // Ensure kramco does not override +combat
          spec.offhand = $item`latte lovers member's mug`;
        }
        return spec;
      },
      limit: { soft: 20 },
      combat: new CombatStrategy().killHard([
        $monster`Frozen Solid Snake`,
        $monster`ninja snowman assassin`,
      ]),
      orbtargets: () => [], // no assassins in orbs
    },
    {
      name: "Climb",
      after: ["Trapper Return", "Ninja"],
      completed: () => step("questL08Trapper") >= 3,
      ready: () => coldPlanner.maximumPossible(true) >= 5,
      prepare: () => {
        if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("cold resistance") < 5)
          throw `Unable to ensure cold res for The Icy Peak`;
      },
      do: (): void => {
        visitUrl("place.php?whichplace=mclargehuge&action=cloudypeak");
      },
      outfit: () => coldPlanner.outfitFor(5),
      limit: { tries: 1 },
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
