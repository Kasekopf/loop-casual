import { cliExecute, Item, itemAmount, myMeat, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  CombatLoversLocket,
  get,
  have,
  Macro,
} from "libram";
import { Quest, step } from "./structure";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

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
      freeaction: true,
    },
    {
      name: "Trapper Request",
      after: ["Start"],
      completed: () => step("questL08Trapper") >= 1,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
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
      limit: { soft: 10 },
    },
    {
      name: "Ore Mountain",
      after: [],
      completed: () => true, // CombatLoversLocket.monstersReminisced().includes($monster`mountain man`),
      ready: () => !have($effect`Everything Looks Yellow`) && myMeat() >= 1000,
      priority: () => !have($effect`Everything Looks Yellow`),
      acquire: [{ item: $item`yellow rocket` }],
      prepare: () => {
        if (
          have($item`unwrapped knock-off retro superhero cape`) &&
          (get("retroCapeSuperhero") !== "heck" || get("retroCapeWashingInstructions") !== "hold")
        ) {
          cliExecute("retrocape heck hold");
        }
      },
      do: () => {
        CombatLoversLocket.reminisce($monster`mountain man`);
      },
      outfit: { equip: $items`unwrapped knock-off retro superhero cape` },
      combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Ore Pull",
      after: ["Trapper Request"],
      completed: () =>
        get("trapperOre") !== undefined &&
        (itemAmount(Item.get(get("trapperOre"))) >= 3 || step("questL08Trapper") >= 2),
      do: () => {
        cliExecute(`pull ${get("trapperOre")}`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Trapper Return",
      after: ["Goatlet", "Ore Pull", "Ore Mountain"],
      completed: () => step("questL08Trapper") >= 2,
      do: () => visitUrl("place.php?whichplace=mclargehuge&action=trappercabin"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Climb",
      after: ["Trapper Return"],
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
