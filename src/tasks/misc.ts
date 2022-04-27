import { CombatStrategy } from "../combat";
import {
  abort,
  adv1,
  cliExecute,
  equippedAmount,
  familiarWeight,
  getWorkshed,
  hermit,
  Item,
  itemAmount,
  knollAvailable,
  myAscensions,
  myBasestat,
  myFamiliar,
  myMeat,
  myPrimestat,
  retrieveItem,
  runChoice,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  CombatLoversLocket,
  get,
  getSaleValue,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { OutfitSpec, Quest, step, Task } from "./structure";
import { Engine } from "../engine";

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      ready: () => myMeat() >= (knollAvailable() ? 538 : 5000),
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => {
        if (knollAvailable()) cliExecute("acquire 1 bitchin' meatcar");
        else cliExecute("acquire 1 desert bus pass");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Island Scrip",
      after: ["Unlock Beach"],
      ready: () => myMeat() >= 500,
      completed: () =>
        itemAmount($item`Shore Inc. Ship Trip Scrip`) >= 3 ||
        have($item`dinghy plans`) ||
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: $location`The Shore, Inc. Travel Agency`,
      choices: { 793: 1 },
      limit: { tries: 5 },
    },
    {
      name: "Unlock Island",
      after: ["Island Scrip"],
      ready: () => myMeat() >= 400 || have($item`dingy planks`),
      completed: () =>
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: () => {
        retrieveItem($item`dingy planks`);
        retrieveItem($item`dinghy plans`);
        use($item`dinghy plans`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Floundry",
      after: [],
      ready: () => false,
      completed: () => have($item`fish hatchet`),
      do: () => cliExecute("acquire 1 fish hatchet"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Kgnee",
      after: [],
      ready: () =>
        have($familiar`Reagnimated Gnome`) &&
        !have($item`gnomish housemaid's kgnee`) &&
        !get("_loopcasual_checkedGnome", false),
      completed: () =>
        !have($familiar`Reagnimated Gnome`) ||
        have($item`gnomish housemaid's kgnee`) ||
        get("_loopcasual_checkedGnome", false),
      do: () => {
        visitUrl("arena.php");
        runChoice(4);
        set("_loopcasual_checkedGnome", true);
      },
      outfit: { familiar: $familiar`Reagnimated Gnome` },
      limit: { tries: 1 },
    },
    {
      name: "Voting",
      after: [],
      ready: () => false,
      completed: () => have($item`"I Voted!" sticker`) || get("_voteToday"),
      do: (): void => {
        // Taken from garbo
        const voterValueTable = [
          {
            monster: $monster`terrible mutant`,
            value: getSaleValue($item`glob of undifferentiated tissue`) + 10,
          },
          {
            monster: $monster`angry ghost`,
            value: getSaleValue($item`ghostly ectoplasm`) * 1.11,
          },
          {
            monster: $monster`government bureaucrat`,
            value: getSaleValue($item`absentee voter ballot`) * 0.05 + 75 * 0.25 + 50,
          },
          {
            monster: $monster`annoyed snake`,
            value: 25 * 0.5 + 25,
          },
          {
            monster: $monster`slime blob`,
            value: 20 * 0.4 + 50 * 0.2 + 250 * 0.01,
          },
        ];

        visitUrl("place.php?whichplace=town_right&action=townright_vote");

        const votingMonsterPriority = voterValueTable
          .sort((a, b) => b.value - a.value)
          .map((element) => element.monster.name);

        const initPriority = new Map<string, number>([
          ["Meat Drop: +30", 10],
          ["Item Drop: +15", 9],
          ["Familiar Experience: +2", 8],
          ["Adventures: +1", 7],
          ["Monster Level: +10", 5],
          [`${myPrimestat()} Percent: +25`, 3],
          [`Experience (${myPrimestat()}): +4`, 2],
          ["Meat Drop: -30", -2],
          ["Item Drop: -15", -2],
          ["Familiar Experience: -2", -2],
        ]);

        const monsterVote =
          votingMonsterPriority.indexOf(get("_voteMonster1")) <
          votingMonsterPriority.indexOf(get("_voteMonster2"))
            ? 1
            : 2;

        const voteLocalPriorityArr = [
          [
            0,
            initPriority.get(get("_voteLocal1")) ||
              (get("_voteLocal1").indexOf("-") === -1 ? 1 : -1),
          ],
          [
            1,
            initPriority.get(get("_voteLocal2")) ||
              (get("_voteLocal2").indexOf("-") === -1 ? 1 : -1),
          ],
          [
            2,
            initPriority.get(get("_voteLocal3")) ||
              (get("_voteLocal3").indexOf("-") === -1 ? 1 : -1),
          ],
          [
            3,
            initPriority.get(get("_voteLocal4")) ||
              (get("_voteLocal4").indexOf("-") === -1 ? 1 : -1),
          ],
        ];

        const bestVotes = voteLocalPriorityArr.sort((a, b) => b[1] - a[1]);
        const firstInit = bestVotes[0][0];
        const secondInit = bestVotes[1][0];

        visitUrl(
          `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
        );
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Protonic Ghost",
      after: [],
      completed: () => step("questL13Final") >= 0, // Stop after tower starts
      ready: () => {
        if (!have($item`protonic accelerator pack`)) return false;
        if (get("questPAGhost") === "unstarted") return false;
        switch (get("ghostLocation")) {
          case $location`The Haunted Conservatory`:
            return step("questM20Necklace") >= 0;
          case $location`The Haunted Gallery`:
            return step("questM21Dance") >= 1;
          case $location`The Haunted Kitchen`:
            return step("questM20Necklace") >= 0;
          case $location`The Haunted Wine Cellar`:
            return step("questL11Manor") >= 1;
          case $location`The Icy Peak`:
            return step("questL08Trapper") === 999;
          case $location`Inside the Palindome`:
            return have($item`Talisman o' Namsilat`);
          case $location`The Old Landfill`:
            return myBasestat(myPrimestat()) >= 25 && step("questL02Larva") >= 0;
          case $location`Madness Bakery`:
          case $location`The Overgrown Lot`:
          case $location`The Skeleton Store`:
            return true; // Can freely start quest
          case $location`The Smut Orc Logging Camp`:
            return step("questL09Topping") >= 0;
          case $location`The Spooky Forest`:
            return step("questL02Larva") >= 0;
        }
        return false;
      },
      prepare: () => {
        // Start quests if needed
        switch (get("ghostLocation")) {
          case $location`Madness Bakery`:
            if (step("questM25Armorer") === -1) {
              visitUrl("shop.php?whichshop=armory");
              visitUrl("shop.php?whichshop=armory&action=talk");
              visitUrl("choice.php?pwd=&whichchoice=1065&option=1");
            }
            return;
          case $location`The Old Landfill`:
            if (step("questM19Hippy") === -1) {
              visitUrl("place.php?whichplace=woods&action=woods_smokesignals");
              visitUrl("choice.php?pwd=&whichchoice=798&option=1");
              visitUrl("choice.php?pwd=&whichchoice=798&option=2");
              visitUrl("woods.php");
            }
            return;
          case $location`The Overgrown Lot`:
            if (step("questM24Doc") === -1) {
              visitUrl("shop.php?whichshop=doc");
              visitUrl("shop.php?whichshop=doc&action=talk");
              runChoice(1);
            }
            return;
          case $location`The Skeleton Store`:
            if (step("questM23Meatsmith") === -1) {
              visitUrl("shop.php?whichshop=meatsmith");
              visitUrl("shop.php?whichshop=meatsmith&action=talk");
              runChoice(1);
            }
            return;
          default:
            return;
        }
      },
      do: () => {
        adv1(get("ghostLocation") ?? $location`none`, 0, "");
      },
      outfit: (): OutfitSpec => {
        if (get("ghostLocation") === $location`Inside the Palindome`)
          return { equip: $items`Talisman o' Namsilat, protonic accelerator pack` };
        return { equip: $items`protonic accelerator pack` };
      },
      combat: new CombatStrategy().macro(
        new Macro()
          .skill($skill`Shoot Ghost`)
          .skill($skill`Shoot Ghost`)
          .skill($skill`Shoot Ghost`)
          .skill($skill`Trap Ghost`)
      ),
      limit: { tries: 10 },
    },
    {
      name: "Acquire Birch Battery",
      after: [],
      ready: () =>
        have($item`SpinMaster™ lathe`) &&
        (!get("_spinmasterLatheVisited") || have($item`flimsy hardwood scraps`)),
      completed: () => have($item`birch battery`),
      do: () => {
        visitUrl("shop.php?whichshop=lathe");
        cliExecute("acquire birch battery");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Firework Hat",
      after: [],
      completed: () => have($item`porkpie-mounted popper`),
      do: () => {
        cliExecute("acquire porkpie-mounted popper");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Cold Medicine Gear",
      after: [],
      completed: () => have($item`ice crown`) && have($item`frozen jeans`),
      ready: () =>
        getWorkshed() === $item`cold medicine cabinet` &&
        get("_coldMedicineConsults") < 5 &&
        get("_nextColdMedicineConsult") <= totalTurnsPlayed(),
      do: () => {
        visitUrl("campground.php?action=workshed");
        runChoice(1);
      },
      freeaction: true,
      limit: { tries: 2 },
    },
    {
      name: "Goose Exp",
      after: [],
      completed: () =>
        familiarWeight($familiar`Grey Goose`) >= 9 ||
        get("_loop_gyou_chef_goose") === "true" ||
        !have($familiar`Shorter-Order Cook`),
      do: () => {
        set("_loop_gyou_chef_goose", "true");
      },
      outfit: { familiar: $familiar`Grey Goose` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Locket Pygmy",
      after: [],
      completed: () => have($skill`Infinite Loop`),
      prepare: () => {
        if (
          equippedAmount($item`unwrapped knock-off retro superhero cape`) === 0 ||
          myFamiliar() !== $familiar`Vampire Vintner`
        )
          abort("Not ready for pygmy locket");
        cliExecute("retrocape heck hold");
      },
      do: () => {
        CombatLoversLocket.reminisce($monster`pygmy witch lawyer`);
      },
      combat: new CombatStrategy().macro(
        new Macro()
          .tryItem($item`cosmic bowling ball`)
          .skill($skill`Pseudopod Slap`)
          .repeat()
      ),
      outfit: {
        modifier: "init",
        equip: $items`unwrapped knock-off retro superhero cape`,
        familiar: $familiar`Vampire Vintner`,
      },
      limit: { tries: 1 },
    },
    {
      name: "Hermit Clover",
      after: [],
      ready: () => myMeat() >= 1000,
      completed: () => get("_loop_gyou_clovers") === "true",
      do: () => {
        hermit($item`11-leaf clover`, 3);
        set("_loop_gyou_clovers", "false");
      },
      limit: { tries: 1 },
    },
  ],
};

export const WandQuest: Quest = {
  name: "Wand",
  tasks: [
    {
      name: "Plus Sign",
      after: [],
      completed: () => have($item`plus sign`) || get("lastPlusSignUnlock") === myAscensions(),
      do: $location`The Enormous Greater-Than Sign`,
      outfit: { modifier: "-combat" },
      choices: { 451: 3 },
      limit: { soft: 20 },
    },
    {
      name: "Get Teleportitis",
      after: ["Plus Sign"],
      ready: () =>
        myMeat() >= 1000 && // Meat for goal teleportitis choice adventure
        familiarWeight($familiar`Grey Goose`) >= 6 && // Goose exp for potential absorbs during teleportits
        have($item`soft green echo eyedrop antidote`), // Antitdote to remove teleportitis afterwards
      priority: () =>
        myMeat() >= 1000 && // Meat for goal teleportitis choice adventure
        familiarWeight($familiar`Grey Goose`) >= 6 && // Goose exp for potential absorbs during teleportits
        have($item`soft green echo eyedrop antidote`), // Antitdote to remove teleportitis afterwards
      completed: () => have($effect`Teleportitis`) || get("lastPlusSignUnlock") === myAscensions(),
      do: $location`The Enormous Greater-Than Sign`,
      outfit: { modifier: "-combat" },
      choices: { 451: 5 },
      limit: { soft: 20 },
    },
    {
      name: "Mimic",
      after: ["Get Teleportitis"],
      ready: () => myMeat() >= 5000,
      completed: () => have($item`dead mimic`) || get("lastZapperWand") === myAscensions(),
      prepare: () => {
        if (have($item`plus sign`)) use($item`plus sign`);
      },
      do: $location`The Dungeons of Doom`,
      outfit: { modifier: "-combat, init", familiar: $familiar`Grey Goose` },
      combat: new CombatStrategy()
        .banish($monster`Quantum Mechanic`)
        .kill(...$monsters`mimic, The Master Of Thieves`), // Avoid getting more teleportitis
      choices: { 25: 2 },
      limit: { soft: 20 },
    },
    {
      name: "Wand",
      after: ["Mimic"],
      completed: () =>
        get("lastZapperWand") === myAscensions() ||
        have($item`aluminum wand`) ||
        have($item`ebony wand`) ||
        have($item`hexagonal wand`) ||
        have($item`marble wand`) ||
        have($item`pine wand`),
      do: () => use($item`dead mimic`),
      freeaction: true,
      limit: { tries: 1 },
    },
  ],
};

export function teleportitisTask(engine: Engine, tasks: Task[]): Task {
  // Combine the choice selections from all tasks
  // Where multiple tasks make different choices at the same choice, prefer:
  //  * Earlier tasks to later tasks
  //  * Uncompleted tasks to completed tasks
  const choices: Task["choices"] = { 3: 3 }; // The goal choice
  const done_tasks = tasks.filter((task) => task.completed());
  const left_tasks = tasks.filter((task) => !task.completed());
  for (const task of [...left_tasks, ...done_tasks].reverse()) {
    for (const choice_id_str in task.choices) {
      const choice_id = parseInt(choice_id_str);
      choices[choice_id] = task.choices[choice_id];
    }
  }

  return {
    name: "Teleportitis",
    after: ["Wand/Get Teleportitis"],
    ready: () => have($effect`Teleportitis`),
    completed: () => get("lastPlusSignUnlock") === myAscensions(),
    do: $location`The Enormous Greater-Than Sign`,
    choices: choices,
    limit: { soft: 20 },
  };
}

export const removeTeleportitis = {
  name: "Clear Teleportitis",
  after: [],
  ready: () => have($item`soft green echo eyedrop antidote`),
  completed: () => !have($effect`Teleportitis`),
  do: () => {
    uneffect($effect`Teleportitis`);
  },
  limit: { soft: 2 },
  freeaction: true,
};

const pulls: Item[] = [
  $item`dromedary drinking helmet`,
  $item`blackberry galoshes`,
  $item`antique machete`,
  $item`ninja rope`,
  $item`ninja carabiner`,
  $item`ninja crampons`,
  $item`wet stew`,
  $item`Mohawk wig`,
  $item`HOA regulation book`,
  $item`yule hatchet`,
  $item`grey down vest`,
  $item`killing jar`,
  $item`Boris's ring`,
  $item`Jarlsberg's earring`,
  $item`Sneaky Pete's breath spray`,
];
export const PullQuest: Quest = {
  name: "Pull",
  tasks: [
    {
      name: "Basic",
      after: [],
      completed: () => {
        const pulled = new Set<Item>(
          get("_roninStoragePulls")
            .split(",")
            .map((id) => parseInt(id))
            .filter((id) => id > 0)
            .map((id) => Item.get(id))
        );
        for (const pull of pulls) {
          if (!pulled.has(pull)) return false;
        }
        return true;
      },
      do: () => {
        const pulled = new Set<Item>(
          get("_roninStoragePulls")
            .split(",")
            .map((id) => parseInt(id))
            .filter((id) => id > 0)
            .map((id) => Item.get(id))
        );
        for (const pull of pulls) {
          if (!pulled.has(pull)) cliExecute(`pull ${pull.name}`);
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Ore",
      after: ["McLargeHuge/Trapper Request"],
      completed: () =>
        get("trapperOre") !== "" &&
        (itemAmount(Item.get(get("trapperOre"))) >= 3 || step("questL08Trapper") >= 2),
      do: () => {
        cliExecute(`pull ${get("trapperOre")}`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

function keyCount(): number {
  let count = itemAmount($item`fat loot token`);
  if (have($item`Boris's key`) || get("nsTowerDoorKeysUsed").includes("Boris")) count++;
  if (have($item`Jarlsberg's key`) || get("nsTowerDoorKeysUsed").includes("Jarlsberg")) count++;
  if (have($item`Sneaky Pete's key`) || get("nsTowerDoorKeysUsed").includes("Sneaky Pete")) count++;
  return count;
}
export const KeysQuest: Quest = {
  name: "Keys",
  tasks: [
    {
      name: "Zap Boris",
      after: ["Pull/Basic", "Wand/Wand"],
      completed: () => get("lastZapperWandExplosionDay") === 1 || !have($item`Boris's ring`),
      do: () => cliExecute("zap Boris's ring"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Zap Jarlsberg",
      after: ["Pull/Basic", "Wand/Wand"],
      completed: () => get("lastZapperWandExplosionDay") === 1 || !have($item`Jarlsberg's earring`),
      do: () => cliExecute("zap Jarlsberg's earring"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Zap Sneaky Pete",
      after: ["Pull/Basic", "Wand/Wand"],
      completed: () =>
        get("lastZapperWandExplosionDay") === 1 || !have($item`Sneaky Pete's breath spray`),
      do: () => cliExecute("zap Sneaky Pete's breath spray"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Daily Dungeon",
      after: ["Zap Boris", "Zap Jarlsberg", "Zap Sneaky Pete"],
      completed: () => get("dailyDungeonDone") || keyCount() >= 3,
      do: $location`The Daily Dungeon`,
      outfit: { equip: $items`ring of Detect Boring Doors` },
      combat: new CombatStrategy().kill(),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
      limit: { tries: 11 },
    },
    {
      name: "Finish",
      after: ["Zap Boris", "Zap Jarlsberg", "Zap Sneaky Pete", "Daily Dungeon"],
      completed: () => keyCount() >= 3,
      do: (): void => {
        throw "Unable to obtain enough fat loot tokens";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Open 8-Bit",
      after: [],
      completed: () => have($item`continuum transfunctioner`),
      do: () => {
        if (!have($item`continuum transfunctioner`)) {
          visitUrl("place.php?whichplace=forestvillage&action=fv_mystic");
          runChoice(1);
          runChoice(1);
          runChoice(1);
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Digital Key",
      after: ["Open 8-Bit"],
      completed: () =>
        get("nsTowerDoorKeysUsed").includes("digital key") ||
        have($item`digital key`) ||
        itemAmount($item`white pixel`) +
          Math.min(
            itemAmount($item`blue pixel`),
            itemAmount($item`red pixel`),
            itemAmount($item`green pixel`)
          ) >=
          30,
      do: $location`8-Bit Realm`,
      outfit: { equip: $items`continuum transfunctioner` },
      combat: new CombatStrategy().banish($monster`Bullet Bill`).kill(),
      limit: { soft: 30 },
    },
  ],
};
