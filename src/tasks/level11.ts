import { buy, cliExecute, itemAmount, myMeat, runChoice, use, visitUrl } from "kolmafia";
import {
  $coinmaster,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  get,
  have,
  Macro,
  uneffect,
} from "libram";
import { OutfitSpec, Quest, step, Task } from "./structure";
import { OverridePriority } from "../priority";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

const Diary: Task[] = [
  {
    name: "Forest",
    after: ["Start"],
    acquire: [{ item: $item`blackberry galoshes` }],
    completed: () => step("questL11Black") >= 2,
    do: $location`The Black Forest`,
    post: () => {
      if (have($effect`Really Quite Poisoned`)) uneffect($effect`Really Quite Poisoned`);
    },
    outfit: () => {
      if (have($item`reassembled blackbird`)) {
        return {
          equip: $items`blackberry galoshes`,
          modifier: "+combat",
        };
      } else {
        return {
          equip: $items`blackberry galoshes`,
          familiar: $familiar`Reassembled Blackbird`,
          modifier: "+combat, item",
        };
      }
    },
    choices: { 923: 1, 924: 1 },
    combat: new CombatStrategy()
      .ignore($monster`blackberry bush`)
      .killItem(...$monsters`black adder, black panther`)
      .kill(),
    limit: { soft: 15 },
  },
  {
    name: "Buy Documents",
    after: ["Forest"],
    ready: () => myMeat() >= 5000,
    completed: () => have($item`forged identification documents`) || step("questL11Black") >= 4,
    do: (): void => {
      visitUrl("woods.php");
      visitUrl("shop.php?whichshop=blackmarket");
      visitUrl("shop.php?whichshop=blackmarket&action=buyitem&whichrow=281&ajax=1&quantity=1");
    },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Diary",
    after: ["Buy Documents", "Misc/Unlock Beach"],
    ready: () => myMeat() >= 500,
    completed: () => step("questL11Black") >= 4,
    do: $location`The Shore, Inc. Travel Agency`,
    choices: { 793: 1 },
    limit: { tries: 1 },
  },
];

const Desert: Task[] = [
  {
    name: "Scrip",
    after: ["Misc/Unlock Beach"],
    ready: () => myMeat() >= 500,
    completed: () => have($item`Shore Inc. Ship Trip Scrip`) || have($item`UV-resistant compass`),
    do: $location`The Shore, Inc. Travel Agency`,
    choices: { 793: 1 },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Compass",
    after: ["Misc/Unlock Beach", "Scrip"],
    completed: () => have($item`UV-resistant compass`),
    do: () => buy($coinmaster`The Shore, Inc. Gift Shop`, 1, $item`UV-resistant compass`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Oasis",
    after: ["Compass"],
    completed: () => get("desertExploration") >= 100,
    ready: () => !have($effect`Ultrahydrated`) && get("desertExploration") > 0,
    do: $location`The Oasis`,
    limit: { soft: 10 },
  },
  {
    name: "Oasis Drum",
    after: ["Compass"],
    ready: () => have($item`worm-riding hooks`) || itemAmount($item`worm-riding manual page`) >= 15,
    priority: () =>
      have($effect`Ultrahydrated`) ? OverridePriority.Effect : OverridePriority.None,
    completed: () =>
      get("desertExploration") >= 100 ||
      have($item`drum machine`) ||
      (get("gnasirProgress") & 16) !== 0,
    do: $location`The Oasis`,
    combat: new CombatStrategy().killItem($monster`blur`),
    outfit: { modifier: "item" },
    limit: { soft: 10 },
    post: (): void => {
      if (!$location`The Arid, Extra-Dry Desert`.noncombatQueue.includes("A Sietch in Time"))
        return;
      if (have($item`worm-riding hooks`) && have($item`drum machine`)) use($item`drum machine`);
    },
  },
  {
    name: "Desert",
    after: ["Diary", "Compass"],
    acquire: [
      { item: $item`can of black paint`, useful: () => (get("gnasirProgress") & 2) === 0 },
      { item: $item`killing jar`, useful: () => (get("gnasirProgress") & 4) === 0 },
    ],
    priority: () =>
      have($effect`Ultrahydrated`) ? OverridePriority.Effect : OverridePriority.None,
    completed: () => get("desertExploration") >= 100,
    do: $location`The Arid, Extra-Dry Desert`,
    outfit: (): OutfitSpec => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherDesertUsed") &&
        have($effect`Ultrahydrated`)
      )
        return {
          equip: $items`industrial fire extinguisher, UV-resistant compass, dromedary drinking helmet`,
          familiar: $familiar`Melodramedary`,
        };
      else
        return {
          equip: $items`UV-resistant compass, dromedary drinking helmet`,
          familiar: $familiar`Melodramedary`,
        };
    },
    combat: new CombatStrategy()
      .macro((): Macro => {
        if (
          have($effect`Ultrahydrated`) &&
          have($item`industrial fire extinguisher`) &&
          get("_fireExtinguisherCharge") >= 20 &&
          !get("fireExtinguisherDesertUsed")
        )
          return new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`);
        else return new Macro();
      })
      .kill(),
    post: (): void => {
      if (!$location`The Arid, Extra-Dry Desert`.noncombatQueue.includes("A Sietch in Time"))
        return;
      if ((get("gnasirProgress") & 16) > 0) return;
      if (
        itemAmount($item`worm-riding manual page`) >= 15 ||
        (get("gnasirProgress") & 2) === 0 ||
        (get("gnasirProgress") & 4) === 0
      ) {
        let res = visitUrl("place.php?whichplace=desertbeach&action=db_gnasir");
        while (res.includes("value=2")) {
          res = runChoice(2);
        }
        runChoice(1);
      }
      cliExecute("use * desert sightseeing pamphlet");
      if (have($item`worm-riding hooks`) && have($item`drum machine`)) use($item`drum machine`);
    },
    limit: { soft: 30 },
    delay: 35,
    choices: { 805: 1 },
  },
];

function rotatePyramid(goal: number): void {
  const ratchets = (goal - get("pyramidPosition") + 5) % 5;
  const to_buy =
    ratchets - itemAmount($item`tomb ratchet`) - itemAmount($item`crumbling wooden wheel`);
  if (to_buy > 0) {
    buy($item`tomb ratchet`, to_buy);
  }
  visitUrl("place.php?whichplace=pyramid&action=pyramid_control");
  for (let i = 0; i < ratchets; i++) {
    if (have($item`crumbling wooden wheel`)) {
      visitUrl("choice.php?whichchoice=929&option=1&pwd");
    } else {
      visitUrl("choice.php?whichchoice=929&option=2&pwd");
    }
  }
  if (get("pyramidPosition") !== goal) throw `Failed to rotate pyramid to ${goal}`;
  visitUrl("choice.php?whichchoice=929&option=5&pwd");
}

const Pyramid: Task[] = [
  {
    name: "Open Pyramid",
    after: ["Desert", "Oasis", "Oasis Drum", "Manor/Boss", "Palindome/Boss", "Hidden City/Boss"],
    completed: () => step("questL11Pyramid") >= 0,
    do: () => visitUrl("place.php?whichplace=desertbeach&action=db_pyramid1"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Upper Chamber",
    after: ["Open Pyramid"],
    completed: () => step("questL11Pyramid") >= 1,
    do: $location`The Upper Chamber`,
    outfit: { modifier: "+combat" },
    limit: { turns: 6 },
  },
  {
    name: "Middle Chamber",
    after: ["Upper Chamber"],
    completed: () => {
      if (!get("controlRoomUnlock")) return false;
      if (get("pyramidBombUsed")) return true;
      const ratchets = itemAmount($item`tomb ratchet`) + itemAmount($item`crumbling wooden wheel`);
      const needed = have($item`ancient bomb`) ? 3 : have($item`ancient bronze token`) ? 7 : 10;
      return ratchets >= needed;
    },
    do: $location`The Middle Chamber`,
    limit: { soft: 20 },
    combat: new CombatStrategy()
      .macro(new Macro().tryItem($item`tangle of rat tails`), $monster`tomb rat`)
      .killItem($monster`tomb rat`, $monster`tomb rat king`)
      .banish($monster`tomb asp`, $monster`tomb servant`),
    outfit: {
      modifier: "item",
    },
    delay: 9,
  },
  {
    name: "Get Token",
    after: ["Middle Chamber"],
    completed: () =>
      have($item`ancient bronze token`) || have($item`ancient bomb`) || get("pyramidBombUsed"),
    do: () => rotatePyramid(4),
    limit: { tries: 1 },
  },
  {
    name: "Get Bomb",
    after: ["Get Token"],
    completed: () => have($item`ancient bomb`) || get("pyramidBombUsed"),
    do: () => rotatePyramid(3),
    limit: { tries: 1 },
  },
  {
    name: "Use Bomb",
    after: ["Get Bomb"],
    completed: () => get("pyramidBombUsed"),
    do: () => rotatePyramid(1),
    limit: { tries: 1 },
  },
  {
    name: "Boss",
    after: ["Use Bomb"],
    completed: () => step("questL11Pyramid") === 999,
    do: () => visitUrl("place.php?whichplace=pyramid&action=pyramid_state1a"),
    combat: new CombatStrategy(true)
      .macro(
        new Macro()
          .trySkill($skill`Saucegeyser`)
          .attack()
          .repeat()
      )
      .kill(),
    limit: { tries: 1 },
  },
];

export const MacguffinQuest: Quest = {
  name: "Macguffin",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(11),
      priority: () => OverridePriority.Free,
      completed: () => step("questL11MacGuffin") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Diary,
    ...Desert,
    ...Pyramid,
    {
      name: "Finish",
      after: ["Boss"],
      completed: () => step("questL11MacGuffin") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
