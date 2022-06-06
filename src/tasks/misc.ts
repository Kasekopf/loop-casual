import { CombatStrategy } from "../combat";
import {
  abort,
  adv1,
  canadiaAvailable,
  cliExecute,
  equippedAmount,
  Familiar,
  familiarWeight,
  getWorkshed,
  gnomadsAvailable,
  hermit,
  itemAmount,
  knollAvailable,
  myAscensions,
  myBasestat,
  myFamiliar,
  myHp,
  myMaxhp,
  myMeat,
  myPrimestat,
  retrieveItem,
  runChoice,
  totalTurnsPlayed,
  use,
  visitUrl,
  weightAdjustment,
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
import { OverridePriority } from "../priority";
import { Engine } from "../engine";
import { Keys, keyStrategy } from "./keys";
import { debug } from "../lib";
import { args } from "../main";
import { GameState } from "../state";

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
      ready: () => myMeat() >= 6000 || (step("questL11Black") >= 4 && myMeat() >= 500),
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
      completed: () => have($item`fish hatchet`) || true,
      do: () => cliExecute("acquire 1 fish hatchet"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Kgnee",
      after: [],
      priority: () => OverridePriority.Free,
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
      priority: () => OverridePriority.Free,
      completed: () => have($item`"I Voted!" sticker`) || get("_voteToday") || !get("voteAlways"),
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
      completed: () => false,
      priority: () => OverridePriority.Always,
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
          return { equip: $items`Talisman o' Namsilat, protonic accelerator pack`, modifier: "DA" };
        if (get("ghostLocation") === $location`The Icy Peak`)
          return { equip: $items`protonic accelerator pack`, modifier: "1000 cold res, DA" };
        return { equip: $items`protonic accelerator pack`, modifier: "DA" };
      },
      combat: new CombatStrategy().macro(() => {
        if (
          myHp() < myMaxhp() ||
          get("ghostLocation") === $location`The Haunted Wine Cellar` ||
          get("ghostLocation") === $location`The Overgrown Lot`
        )
          return new Macro().attack().repeat();
        else
          return new Macro()
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
      }),
      post: () => {
        if (get("questPAGhost") !== "unstarted") {
          throw `Failed to kill ghost from protonic accelerator pack`;
        }
      },
      limit: { tries: 20 },
    },
    {
      name: "Acquire Birch Battery",
      after: [],
      priority: () => OverridePriority.Free,
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
      priority: () => OverridePriority.Free,
      completed: () => have($item`sombrero-mounted sparkler`),
      do: () => {
        cliExecute("acquire sombrero-mounted sparkler");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Acquire Cold Medicine Gear",
      after: [],
      priority: () => OverridePriority.Free,
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
      priority: () => OverridePriority.Free,
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
      priority: () => OverridePriority.Start,
      completed: () => have($skill`Infinite Loop`),
      acquire: [
        {
          item: $item`Arr, M80`,
          num: 2,
          useful: () =>
            have($familiar`Vampire Vintner`) &&
            have($item`cosmic bowling ball`) &&
            have($item`unwrapped knock-off retro superhero cape`),
        },
        {
          // Backup plan if missing Vintner/bowling ball
          item: $item`yellow rocket`,
          num: 1,
          useful: () =>
            !have($familiar`Vampire Vintner`) ||
            !have($item`cosmic bowling ball`) ||
            !have($item`unwrapped knock-off retro superhero cape`),
        },
      ],
      prepare: () => {
        if (
          (equippedAmount($item`unwrapped knock-off retro superhero cape`) === 0 ||
            myFamiliar() !== $familiar`Vampire Vintner`) &&
          !have($item`yellow rocket`)
        )
          abort("Not ready for pygmy locket");
        if (equippedAmount($item`unwrapped knock-off retro superhero cape`) > 0)
          cliExecute("retrocape heck hold");
      },
      do: () => {
        CombatLoversLocket.reminisce($monster`pygmy witch lawyer`);
      },
      combat: new CombatStrategy().macro(
        new Macro()
          .tryItem($item`yellow rocket`)
          .tryItem($item`cosmic bowling ball`)
          .step("if hascombatitem 10769;use Arr;endif;") // Arr, M80; "use Arr, M80" trys and fails to funksling
          .step("if hascombatitem 10769;use Arr;endif;")
          .skill($skill`Pseudopod Slap`)
          .repeat()
      ),
      outfit: () => {
        if (
          have($familiar`Vampire Vintner`) &&
          have($item`cosmic bowling ball`) &&
          have($item`unwrapped knock-off retro superhero cape`)
        )
          return {
            modifier: "init",
            equip: $items`unwrapped knock-off retro superhero cape`,
            familiar: $familiar`Vampire Vintner`,
          };
        else return { modifier: "init" }; // Just use yellow rocket
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
        set("_loop_gyou_clovers", "true");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Fortune",
      after: ["Hidden City/Open City"],
      completed: () => get("_clanFortuneBuffUsed") || !have($item`Clan VIP Lounge key`),
      priority: () => OverridePriority.Free,
      do: () => {
        cliExecute("fortune buff susie");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Friar Buff",
      after: ["Friar/Finish", "Macguffin/Desert"], // After the desert to avoid wasting it on the camel
      completed: () => get("friarsBlessingReceived"),
      ready: () => familiarWeight($familiar`Grey Goose`) < 6,
      priority: () => OverridePriority.Free,
      do: () => {
        cliExecute("friars familiar");
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Dog Chow",
      after: [],
      ready: () => have($item`Ghost Dog Chow`) && familiarWeight($familiar`Grey Goose`) < 6,
      completed: () => false,
      do: () => {
        use($item`Ghost Dog Chow`);
        if (familiarWeight($familiar`Grey Goose`) < 6 && have($item`Ghost Dog Chow`))
          use($item`Ghost Dog Chow`);
      },
      outfit: { familiar: $familiar`Grey Goose` },
      freeaction: true,
      limit: { soft: 20 },
    },
    {
      name: "Cake-Shaped Arena",
      after: [],
      ready: () => familiarWeight($familiar`Grey Goose`) < 6 && myMeat() >= 100,
      completed: () => false,
      do: arenaFight,
      outfit: { familiar: $familiar`Grey Goose`, modifier: "50 familiar exp, familiar weight" },
      freeaction: true,
      limit: { soft: 75 },
    },
    {
      name: "Amulet Coin",
      after: [],
      completed: () =>
        have($item`amulet coin`) ||
        !have($skill`Summon Clip Art`) ||
        get("tomeSummons") >= 3 ||
        !have($familiar`Cornbeefadon`),
      priority: () => OverridePriority.Free,
      do: () => {
        retrieveItem($item`box of Familiar Jacks`);
        use($item`box of Familiar Jacks`);
      },
      outfit: { familiar: $familiar`Cornbeefadon` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Boombox",
      after: [],
      priority: () => OverridePriority.Free,
      completed: () =>
        !have($item`SongBoom™ BoomBox`) || get("boomBoxSong") === "Total Eclipse of Your Meat",
      do: () => cliExecute("boombox meat"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Gnome Shirt",
      after: [],
      ready: () => myMeat() >= 11000 && gnomadsAvailable(),
      completed: () => have($skill`Torso Awareness`),
      priority: () => OverridePriority.Free,
      freeaction: true,
      do: () => {
        visitUrl("gnomes.php?action=trainskill&whichskill=12");
      },
      limit: { tries: 1 },
    },
    {
      name: "Gnome Items",
      after: ["Gnome Shirt"],
      ready: () => myMeat() >= 11000 && gnomadsAvailable(),
      completed: () => have($skill`Powers of Observatiogn`),
      priority: () => OverridePriority.Free,
      freeaction: true,
      do: () => {
        visitUrl("gnomes.php?action=trainskill&whichskill=10");
      },
      limit: { tries: 1 },
    },
    {
      name: "Tune from Muscle",
      after: ["Unlock Beach", "Reprocess/The Bugbear Pen"],
      ready: () => knollAvailable(),
      completed: () =>
        !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
      priority: () => OverridePriority.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Tune from Myst",
      after: ["Reprocess/Outskirts of Camp Logging Camp"],
      ready: () => canadiaAvailable(),
      completed: () =>
        !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
      priority: () => OverridePriority.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Tune from Moxie",
      after: ["Reprocess/Thugnderdome", "Gnome Shirt", "Gnome Items"],
      ready: () => gnomadsAvailable(),
      completed: () =>
        !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
      priority: () => OverridePriority.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Retune Moon",
      after: ["Tune from Muscle", "Tune from Myst", "Tune from Moxie"],
      ready: () => false,
      completed: () =>
        !have($item`hewn moon-rune spoon`) || args.tune === undefined || get("moonTuned", false),
      do: () => false,
      limit: { tries: 1 },
    },
    {
      name: "Summon Lion",
      after: ["Hidden City/Bowling Skills"],
      ready: () => have($item`white page`),
      completed: () => have($skill`Piezoelectric Honk`),
      do: () => use($item`white page`),
      limit: { tries: 1 },
      choices: { 940: 2 },
      outfit: { modifier: "item" },
      combat: new CombatStrategy().killItem($monster`white lion`),
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
        familiarWeight($familiar`Grey Goose`) >= 6
          ? OverridePriority.GoodGoose
          : OverridePriority.None,
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
      completed: () =>
        have($item`dead mimic`) ||
        get("lastZapperWand") === myAscensions() ||
        have($item`aluminum wand`) ||
        have($item`ebony wand`) ||
        have($item`hexagonal wand`) ||
        have($item`marble wand`) ||
        have($item`pine wand`) ||
        (keyStrategy.useful(Keys.ZapBoris) === false &&
          keyStrategy.useful(Keys.ZapJarlsberg) === false &&
          keyStrategy.useful(Keys.ZapSneaky) === false),
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
        have($item`pine wand`) ||
        (keyStrategy.useful(Keys.ZapBoris) === false &&
          keyStrategy.useful(Keys.ZapJarlsberg) === false &&
          keyStrategy.useful(Keys.ZapSneaky) === false),
      do: () => use($item`dead mimic`),
      freeaction: true,
      limit: { tries: 1 },
    },
  ],
};

export function teleportitisTask(engine: Engine, tasks: Task[], state: GameState): Task {
  // Combine the choice selections from all tasks
  // Where multiple tasks make different choices at the same choice, prefer:
  //  * Earlier tasks to later tasks
  //  * Uncompleted tasks to completed tasks
  const choices: Task["choices"] = { 3: 3 }; // The goal choice
  // Escape the hidden city alters if nothing else is available
  choices[781] = 6;
  choices[783] = 6;
  choices[785] = 6;
  choices[787] = 6;

  const done_tasks = tasks.filter((task) => task.completed(state));
  const left_tasks = tasks.filter((task) => !task.completed(state));
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
    outfit: { equip: $items`antique machete` },
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

// Cake-shaped arena strengths for all of the possible house familiars (and the goose)
const houseFamiliars = new Map<Familiar, [number, number, number, number]>([
  [$familiar`Angry Goat`, [3, 0, 2, 1]],
  [$familiar`Baby Gravy Fairy`, [0, 3, 1, 2]], // mafia and wiki disagree
  [$familiar`Barrrnacle`, [0, 2, 1, 3]],
  [$familiar`Blood-Faced Volleyball`, [0, 1, 3, 2]],
  [$familiar`Clockwork Grapefruit`, [3, 2, 0, 1]],
  [$familiar`Cocoabo`, [2, 3, 0, 1]],
  [$familiar`Fuzzy Dice`, [2, 2, 2, 2]],
  [$familiar`Ghuol Whelp`, [1, 2, 0, 3]],
  [$familiar`Grue`, [2, 0, 1, 3]],
  [$familiar`Hanukkimbo Dreidl`, [2, 1, 3, 1]],
  [$familiar`Hovering Sombrero`, [0, 3, 2, 1]],
  [$familiar`Howling Balloon Monkey`, [1, 3, 2, 0]],
  [$familiar`Killer Bee`, [3, 1, 2, 0]],
  [$familiar`Leprechaun`, [1, 3, 0, 2]],
  [$familiar`Levitating Potato`, [0, 1, 2, 3]],
  [$familiar`MagiMechTech MicroMechaMech`, [3, 0, 1, 2]],
  [$familiar`Mosquito`, [2, 1, 3, 0]],
  [$familiar`Sabre-Toothed Lime`, [3, 0, 2, 1]],
  [$familiar`Spooky Pirate Skeleton`, [2, 3, 1, 0]],
  [$familiar`Stab Bat`, [3, 2, 1, 0]],
  [$familiar`Star Starfish`, [2, 1, 3, 0]],
  [$familiar`Whirling Maple Leaf`, [3, 1, 2, 0]],
  // Along with our non-house familiar
  [$familiar`Grey Goose`, [1, 2, 3, 3]],
]);

function arenaStrength(familiar: Familiar, weight: number, event: number) {
  const strengths = houseFamiliars.get(familiar);
  if (strengths === undefined) {
    throw `Weights for familiar ${familiar.hatchling} not found.`;
  }
  const strength = strengths[event - 1];
  switch (strength) {
    case 3:
      return weight + 3;
    case 2:
      return weight;
    case 1:
      return weight - 3;
    case 0:
      return 0;
  }
  return 0;
}

interface ArenaOption {
  opponent: number;
  familiar: Familiar;
  event: number; // 1, 2, 3, 4
  delta: number; // [My familiar strength] - [House familiar strength]
}

export function arenaFight() {
  // Train for a single round in the arena, using our current equipment

  // Parse arena opponents
  const familiar_regex = new RegExp(
    /<[^>]+value=(\d+)><\/td><td[^>]*><img[^>]+><\/td><td class=small><b>[^<]+<\/b> the ([^<]+)<br>([\d]+) lb/g
  );
  const arena = visitUrl("arena.php");
  let match;
  const options: ArenaOption[] = [];
  do {
    match = familiar_regex.exec(arena);
    if (match) {
      const opponent = parseInt(match[1]);
      const familiar = Familiar.get(match[2]);
      const weight = parseInt(match[3]);
      if (
        Number.isNaN(opponent) ||
        Number.isNaN(weight) ||
        weight === 0 ||
        familiar === $familiar`none`
      ) {
        throw `Unable to parse arena familiar ${match[1]} @ ${match[2]} lbs`;
      }
      for (const event of [1, 2, 3, 4]) {
        options.push({
          opponent: opponent,
          familiar: familiar,
          event: event,
          delta:
            arenaStrength(
              $familiar`Grey Goose`,
              familiarWeight($familiar`Grey Goose`) + weightAdjustment(),
              event
            ) - arenaStrength(familiar, weight, event),
        });
      }
    }
  } while (match);

  // Find the best opponent.
  // i.e. the strongest opponent that we can beat with at least 4 weight
  const bestOption = options.sort((o, p) => o.delta - p.delta).find((o) => o.delta >= 4);
  if (bestOption === undefined) {
    debug("Unable to find good arena opponent; defaulting to mafia", "red");
    cliExecute("train turns 1");
  } else {
    debug(`Fighting ${bestOption.familiar} with Δweight=${bestOption.delta}`);
    const start_exp = $familiar`Grey Goose`.experience;
    visitUrl(`arena.php?action=go&whichopp=${bestOption.opponent}&event=${bestOption.event}`, true);
    if (start_exp === $familiar`Grey Goose`.experience) throw `Lost training in cake-shaped arena`;
    debug(`Experience gained: ${$familiar`Grey Goose`.experience - start_exp}`);
  }
}
