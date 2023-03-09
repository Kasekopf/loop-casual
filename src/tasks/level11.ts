import {
  availableAmount,
  buy,
  cliExecute,
  familiarWeight,
  itemAmount,
  myMeat,
  runChoice,
  use,
  visitUrl,
} from "kolmafia";
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
import { Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel, debug } from "../lib";
import { councilSafe } from "./level12";
import { globalStateCache } from "../engine/state";
import { towerSkip } from "./level13";

const Diary: Task[] = [
  {
    name: "Forest",
    after: ["Start"],
    completed: () => step("questL11Black") >= 2,
    prepare: () => {
      if (have($item`MayDay™ supply package`)) use($item`MayDay™ supply package`);
    },
    do: $location`The Black Forest`,
    post: () => {
      if (have($effect`Really Quite Poisoned`)) uneffect($effect`Really Quite Poisoned`);
    },
    outfit: () => {
      const equip = [$item`blackberry galoshes`];
      if (have($item`latte lovers member's mug`) && !get("latteUnlocks").includes("cajun")) {
        equip.push($item`latte lovers member's mug`);
      }

      if (have($item`reassembled blackbird`)) {
        return {
          equip: equip,
          modifier: "50 combat 5max, -1ML",
        };
      }

      if (
        globalStateCache.absorb().isReprocessTarget($monster`black magic woman`) &&
        familiarWeight($familiar`Grey Goose`) >= 6
      ) {
        const orb = globalStateCache.orb().prediction($location`The Black Forest`);
        if (orb === $monster`black magic woman`) {
          // Swoop in for a single adventure to reprocess the black magic woman
          return {
            equip: [...equip, $item`miniature crystal ball`],
            familiar: $familiar`Grey Goose`,
            modifier: "50 combat 5max, -1ML",
          };
        }
      }

      return {
        equip: equip,
        familiar: $familiar`Reassembled Blackbird`,
        modifier: "50 combat 5max, item, -1ML",
        avoid: $items`broken champagne bottle`,
      };
    },
    choices: {
      923: 1,
      924: () => {
        if (!have($familiar`Shorter-Order Cook`) && !have($item`beehive`)) return 3;
        if (!have($item`blackberry galoshes`) && itemAmount($item`blackberry`) >= 3) return 2;
        return 1;
      },
      928: 4,
      1018: 1,
      1019: 1,
    },
    combat: new CombatStrategy()
      .ignore($monster`blackberry bush`)
      .killItem($monsters`black adder, black panther`)
      .kill(),
    orbtargets: () => undefined, // do not dodge anything with orb
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
    outfit: { equip: $items`designer sweatpants` },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Diary",
    after: ["Buy Documents", "Misc/Unlock Beach"],
    ready: () => myMeat() >= 500,
    completed: () => step("questL11Black") >= 4,
    do: $location`The Shore, Inc. Travel Agency`,
    post: (): void => {
      if (step("questL11Black") < 4) {
        debug("Possible mafia diary desync detected; refreshing...");
        cliExecute("refresh all");
        if (have($item`your father's MacGuffin diary`)) use($item`your father's MacGuffin diary`);
        visitUrl("questlog.php?which=1");
      }
    },
    choices: { 793: 1 },
    limit: { tries: 1 },
  },
];

const Desert: Task[] = [
  {
    name: "Scrip",
    after: ["Misc/Unlock Beach"],
    ready: () => myMeat() >= 6000 || (step("questL11Black") >= 4 && myMeat() >= 500),
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
    ready: () => !have($effect`Ultrahydrated`) && get("oasisAvailable", false),
    do: $location`The Oasis`,
    limit: { soft: 10 },
  },
  {
    name: "Oasis Drum",
    after: ["Compass"],
    ready: () => have($item`worm-riding hooks`) || itemAmount($item`worm-riding manual page`) >= 15,
    priority: () => (have($effect`Ultrahydrated`) ? Priorities.Effect : Priorities.None),
    completed: () =>
      get("desertExploration") >= 100 ||
      have($item`drum machine`) ||
      (get("gnasirProgress") & 16) !== 0,
    prepare: () => {
      if (globalStateCache.absorb().hasReprocessTargets($location`The Oasis`)) {
        // Use ghost dog chow to prepare to reprocess Blur without needing arena adventures
        while (familiarWeight($familiar`Grey Goose`) < 6 && have($item`Ghost Dog Chow`))
          use($item`Ghost Dog Chow`);
      }
    },
    do: $location`The Oasis`,
    combat: new CombatStrategy().killItem($monster`blur`),
    outfit: { modifier: "item", avoid: $items`broken champagne bottle` },
    limit: { soft: 15 },
    post: (): void => {
      if (!visitUrl("place.php?whichplace=desertbeach").includes("action=db_gnasir")) return;
      if (
        itemAmount($item`worm-riding manual page`) >= 15 ||
        ((get("gnasirProgress") & 1) === 0 && have($item`stone rose`)) ||
        ((get("gnasirProgress") & 2) === 0 && have($item`can of black paint`)) ||
        ((get("gnasirProgress") & 4) === 0 && have($item`killing jar`))
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
  },
  {
    name: "Milestone",
    after: ["Misc/Unlock Beach", "Diary"],
    ready: () => have($item`milestone`),
    completed: () => !have($item`milestone`) || get("desertExploration") >= 100,
    do: () => use($item`milestone`, availableAmount($item`milestone`)),
    limit: { tries: 5 }, // 5 to account for max of starting, poke garden & pull
    freeaction: true,
  },
  {
    name: "Desert",
    after: ["Diary", "Compass"],
    acquire: [{ item: $item`can of black paint`, useful: () => (get("gnasirProgress") & 2) === 0 }],
    ready: () =>
      (have($item`can of black paint`) || myMeat() >= 1000 || (get("gnasirProgress") & 2) !== 0) &&
      itemAmount($item`worm-riding manual page`) < 15 &&
      !have($item`worm-riding hooks`) &&
      ((!get("oasisAvailable", false) && !have($effect`A Girl Named Sue`)) ||
        have($effect`Ultrahydrated`)),
    priority: () => (have($effect`Ultrahydrated`) ? Priorities.Effect : Priorities.None),
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
      else if (
        globalStateCache.absorb().isReprocessTarget($monster`swarm of fire ants`) &&
        familiarWeight($familiar`Grey Goose`) >= 6 &&
        have($item`miniature crystal ball`)
      ) {
        if (
          globalStateCache.orb().prediction($location`The Arid, Extra-Dry Desert`) ===
          $monster`swarm of fire ants`
        ) {
          // Swoop in for a single adventure to reprocess the fire ants
          return {
            equip: $items`UV-resistant compass, miniature crystal ball`,
            familiar: $familiar`Grey Goose`,
          };
        } else {
          // Wait for the orb to predict swarm of fire ants
          return {
            equip: $items`UV-resistant compass, miniature crystal ball`,
            familiar: $familiar`Melodramedary`,
          };
        }
      } else
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
      if (!visitUrl("place.php?whichplace=desertbeach").includes("action=db_gnasir")) return;
      if ((get("gnasirProgress") & 16) > 0) return;
      if (
        itemAmount($item`worm-riding manual page`) >= 15 ||
        ((get("gnasirProgress") & 1) === 0 && have($item`stone rose`)) ||
        ((get("gnasirProgress") & 2) === 0 && have($item`can of black paint`)) ||
        ((get("gnasirProgress") & 4) === 0 && have($item`killing jar`))
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
    limit: { soft: 30 },
    combat: new CombatStrategy()
      .macro(
        Macro.tryItem($item`tangle of rat tails`).trySkill($skill`Otoscope`),
        $monster`tomb rat`
      )
      .killItem([$monster`tomb rat`, $monster`tomb rat king`])
      .banish([$monster`tomb asp`, $monster`tomb servant`]),
    outfit: () => {
      return {
        modifier: "item",
        familiar: $familiar`Grey Goose`,
        equip:
          have($item`Lil' Doctor™ bag`) && get("_otoscopeUsed") < 3 ? $items`Lil' Doctor™ bag` : [],
      };
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
    post: () => {
      // Autunmaton returning is not properly tracked
      cliExecute("refresh all");
    },
    outfit: () => {
      if (!have($item`Pick-O-Matic lockpicks`) && !towerSkip())
        return { familiar: $familiar`Gelatinous Cubeling` }; // Ensure we get equipment
      return {};
    },
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .while_("!mpbelow 20", new Macro().trySkill($skill`Infinite Loop`))
          .attack()
          .repeat()
      )
      .killHard(),
    limit: { tries: 1 },
    boss: true,
  },
];

export const MacguffinQuest: Quest = {
  name: "Macguffin",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(11),
      priority: () => Priorities.Free, // Always start this quest ASAP, it is key for routing
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
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      completed: () => step("questL11MacGuffin") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
