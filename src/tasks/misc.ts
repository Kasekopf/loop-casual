import { CombatStrategy } from "../engine/combat";
import {
  adv1,
  canadiaAvailable,
  cliExecute,
  equippedAmount,
  Familiar,
  familiarWeight,
  gamedayToInt,
  getCampground,
  getWorkshed,
  gnomadsAvailable,
  haveEquipped,
  hermit,
  hippyStoneBroken,
  inHardcore,
  Item,
  itemAmount,
  knollAvailable,
  myAdventures,
  myAscensions,
  myBasestat,
  myHp,
  myLevel,
  myMaxhp,
  myMaxmp,
  myMeat,
  myPrimestat,
  mySign,
  myTurncount,
  numericModifier,
  print,
  retrieveItem,
  runChoice,
  turnsPlayed,
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
  $slots,
  $stat,
  AsdonMartin,
  AutumnAton,
  BurningLeaves,
  ensureEffect,
  get,
  getSaleValue,
  have,
  haveInCampground,
  Macro,
  Robortender,
  set,
  uneffect,
} from "libram";
import { Quest, Task } from "../engine/task";
import { Outfit, OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { Engine, wanderingNCs } from "../engine/engine";
import { Keys, keyStrategy } from "./keys";
import { atLevel, debug } from "../lib";
import { args } from "../args";
import { globalStateCache } from "../engine/state";
import { coldPlanner, yellowSubmarinePossible } from "../engine/outfit";
import {
  getTrainsetConfiguration,
  getTrainsetPosition,
  getTrainsetPositionsUntilConfigurable,
  setTrainsetConfiguration,
  TrainsetPiece,
} from "./trainrealm";

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= (knollAvailable() ? 538 : 5000),
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => {
        if (knollAvailable()) cliExecute("acquire 1 bitchin' meatcar");
        else cliExecute("acquire 1 desert bus pass");
      },
      outfit: { equip: $items`designer sweatpants` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Island Scrip",
      after: ["Unlock Beach"],
      ready: () =>
        (myMeat() >= 6000 || (step("questL11Black") >= 4 && myMeat() >= 500)) &&
        myAdventures() >= 20 &&
        !yellowSubmarinePossible(),
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
      ready: () => (myMeat() >= 400 || have($item`dingy planks`)) && !yellowSubmarinePossible(),
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
      name: "Unlock Island Submarine",
      after: ["Digital/Open"],
      ready: () =>
        itemAmount($item`yellow pixel`) >= 50 &&
        itemAmount($item`red pixel`) >= 5 &&
        itemAmount($item`blue pixel`) >= 5 &&
        itemAmount($item`green pixel`) >= 5,
      completed: () =>
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: () => {
        retrieveItem($item`yellow submarine`);
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
      priority: () => Priorities.Free,
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
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Voting",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        !args.minor.voterbooth ||
        have($item`"I Voted!" sticker`) ||
        get("_voteToday") ||
        !get("voteAlways"),
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
            value: gamedayToInt(),
          },
          {
            monster: $monster`slime blob`,
            value: 95 - gamedayToInt(),
          },
        ];

        visitUrl("place.php?whichplace=town_right&action=townright_vote");

        const monPriority = voterValueTable
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
          monPriority.indexOf(get("_voteMonster1")) < monPriority.indexOf(get("_voteMonster2"))
            ? 1
            : 2;

        const voteLocalPriorityArr = [
          "_voteLocal1",
          "_voteLocal2",
          "_voteLocal3",
          "_voteLocal4",
        ].map((v, i) => [i, initPriority.get(get(v)) || (get(v).indexOf("-") === -1 ? 1 : -1)]);

        const bestVotes = voteLocalPriorityArr.sort((a, b) => b[1] - a[1]);
        const firstInit = bestVotes[0][0];
        const secondInit = bestVotes[1][0];

        visitUrl(
          `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
        );

        if (!have($item`"I Voted!" sticker`)) {
          cliExecute("refresh all");
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Protonic Ghost",
      after: [],
      completed: () => false,
      priority: () => {
        if (!get("lovebugsUnlocked") && have($item`designer sweatpants`) && get("sweat") < 5) {
          // Wait for more sweat, if possible
          return Priorities.BadSweat;
        } else return Priorities.Always;
      },
      ready: () => {
        if (!have($item`protonic accelerator pack`)) return false;
        if (get("questPAGhost") === "unstarted") return false;
        switch (get("ghostLocation")) {
          case $location`Cobb's Knob Treasury`:
            return step("questL05Goblin") >= 1;
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
          case $location`The Icy Peak`:
            if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
            if (numericModifier("cold resistance") < 5)
              throw `Unable to ensure cold res for The Icy Peak`;
            return;
          default:
            return;
        }
      },
      do: () => {
        adv1(get("ghostLocation") ?? $location`none`, 0, "");
        if (wanderingNCs.has(get("lastEncounter"))) {
          adv1(get("ghostLocation") ?? $location`none`, 0, "");
        }
      },
      outfit: (): OutfitSpec | Outfit => {
        if (get("ghostLocation") === $location`Inside the Palindome`)
          return {
            equip: $items`Talisman o' Namsilat, protonic accelerator pack, designer sweatpants`,
            modifier: "DA, DR",
          };
        if (get("ghostLocation") === $location`The Icy Peak`) {
          if (
            !get("lovebugsUnlocked") &&
            have($item`designer sweatpants`) &&
            get("sweat") >= 5 &&
            coldPlanner.maximumPossible(true, $slots`back, pants`) >= 5
          ) {
            return coldPlanner.outfitFor(5, {
              equip: $items`protonic accelerator pack, designer sweatpants`,
              modifier: "DA, DR",
            });
          }
          if (coldPlanner.maximumPossible(true, $slots`back`) >= 5)
            return coldPlanner.outfitFor(5, {
              equip: $items`protonic accelerator pack`,
              modifier: "DA, DR",
            });
          else return coldPlanner.outfitFor(5, { modifier: "DA, DR" }); // not enough cold res without back
        }
        return {
          equip: $items`protonic accelerator pack, designer sweatpants`,
          modifier: "DA, DR",
        };
      },
      combat: new CombatStrategy().macro(() => {
        if (get("lovebugsUnlocked")) {
          return new Macro()
            .skill($skill`Summon Love Gnats`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
        }

        if (haveEquipped($item`designer sweatpants`) && get("sweat") >= 5) {
          return new Macro()
            .skill($skill`Sweat Flood`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Shoot Ghost`)
            .skill($skill`Trap Ghost`);
        }

        if (
          myHp() < myMaxhp() ||
          get("ghostLocation") === $location`The Haunted Wine Cellar` ||
          get("ghostLocation") === $location`The Overgrown Lot` ||
          equippedAmount($item`protonic accelerator pack`) === 0
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
      limit: { tries: 20, unready: true },
    },
    {
      name: "Acquire Birch Battery",
      after: [],
      priority: () => Priorities.Free,
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
      priority: () => Priorities.Free,
      ready: () => myMeat() >= 500,
      completed: () =>
        have($item`sombrero-mounted sparkler`) ||
        get("_fireworksShopHatBought") ||
        !have($item`Clan VIP Lounge key`),
      do: () => {
        visitUrl("clan_viplounge.php");
        visitUrl("clan_viplounge.php?action=fwshop&whichfloor=2");
        cliExecute("acquire sombrero-mounted sparkler");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Goose Exp",
      after: [],
      priority: () => Priorities.Free,
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
      name: "Hermit Clover",
      after: ["Hidden City/Open Temple"],
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
      after: [],
      ready: () =>
        ((inHardcore() && myAdventures() < 20 && myTurncount() >= 50) ||
          step("questL11Worship") >= 3) &&
        familiarWeight($familiar`Grey Goose`) < 6,
      completed: () => get("_clanFortuneBuffUsed") || !have($item`Clan VIP Lounge key`),
      priority: () => Priorities.Free,
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
      priority: () => Priorities.Free,
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
      completed: () => globalStateCache.absorb().remainingReprocess().length === 0,
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
      completed: () => globalStateCache.absorb().remainingReprocess().length === 0,
      priority: () => Priorities.Last,
      do: arenaFight,
      outfit: { familiar: $familiar`Grey Goose`, modifier: "50 familiar exp, familiar weight" },
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
      priority: () => Priorities.Free,
      do: () => {
        retrieveItem($item`box of Familiar Jacks`);
        use($item`box of Familiar Jacks`);
      },
      outfit: { familiar: $familiar`Cornbeefadon` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Grey Down Vest",
      after: [],
      completed: () =>
        have($item`grey down vest`) || !have($skill`Summon Clip Art`) || get("tomeSummons") >= 3,
      priority: () => Priorities.Free,
      do: () => {
        retrieveItem($item`box of Familiar Jacks`);
        use($item`box of Familiar Jacks`);
      },
      outfit: { familiar: $familiar`Grey Goose` },
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Boombox",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        !have($item`SongBoom™ BoomBox`) ||
        get("boomBoxSong") === "Total Eclipse of Your Meat" ||
        (have($skill`System Sweep`) && have($skill`Double Nanovision`) && args.minor.seasoning) ||
        get("_boomBoxSongsLeft") === 0,
      do: () => cliExecute("boombox meat"),
      freeaction: true,
      limit: { tries: 1 },
    },
    {
      name: "Boombox Seasoning",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        have($skill`System Sweep`) &&
        have($skill`Double Nanovision`) &&
        (get("currentNunneryMeat") === 0 || get("currentNunneryMeat") === 100000),
      completed: () =>
        !have($item`SongBoom™ BoomBox`) ||
        get("boomBoxSong") === "Food Vibrations" ||
        get("_boomBoxSongsLeft") === 0 ||
        !args.minor.seasoning,
      do: () => cliExecute("boombox food"),
      freeaction: true,
      limit: { tries: 2, unready: true },
    },
    {
      name: "Gnome Shirt",
      after: [],
      ready: () =>
        (myMeat() >= 11000 || (myMeat() >= 6000 && getWorkshed() === $item`model train set`)) &&
        gnomadsAvailable(),
      completed: () => have($skill`Torso Awareness`),
      priority: () => Priorities.Free,
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
      priority: () => Priorities.Free,
      freeaction: true,
      do: () => {
        visitUrl("gnomes.php?action=trainskill&whichskill=10");
      },
      limit: { tries: 1 },
    },
    {
      name: "Tune from Muscle",
      after: ["Unlock Beach", "Bugbear Outfit"],
      ready: () =>
        knollAvailable() &&
        (mySign() !== "Vole" ||
          ((myMaxmp() - numericModifier("Maximum MP") >= 50 ||
            (myMaxmp() - numericModifier("Maximum MP") >= 40 && have($item`birch battery`))) &&
            myMaxhp() - numericModifier("Maximum HP") >= 40 &&
            myMeat() >= 6000)),
      completed: () =>
        !have($item`hewn moon-rune spoon`) ||
        args.major.tune === undefined ||
        get("moonTuned", false),
      priority: () => Priorities.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.major.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Tune from Myst",
      after: [],
      ready: () => canadiaAvailable(),
      completed: () =>
        !have($item`hewn moon-rune spoon`) ||
        args.major.tune === undefined ||
        get("moonTuned", false),
      priority: () => Priorities.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.major.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Tune from Moxie",
      after: ["Gnome Shirt", "Gnome Items"],
      ready: () => gnomadsAvailable(),
      completed: () =>
        !have($item`hewn moon-rune spoon`) ||
        args.major.tune === undefined ||
        get("moonTuned", false),
      priority: () => Priorities.Free,
      freeaction: true,
      do: () => cliExecute(`spoon ${args.major.tune}`),
      limit: { tries: 1 },
    },
    {
      name: "Retune Moon",
      after: ["Tune from Muscle", "Tune from Myst", "Tune from Moxie"],
      ready: () => false,
      completed: () =>
        !have($item`hewn moon-rune spoon`) ||
        args.major.tune === undefined ||
        get("moonTuned", false),
      do: () => false,
      limit: { tries: 1 },
    },
    {
      name: "Mayday",
      after: ["Macguffin/Start"],
      priority: () => Priorities.Free,
      completed: () =>
        !get("hasMaydayContract") || (!have($item`MayDay™ supply package`) && atLevel(11)),
      ready: () => have($item`MayDay™ supply package`) && myTurncount() < 1000,
      do: () => use($item`MayDay™ supply package`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Open Fantasy",
      after: [],
      ready: () => get("frAlways") || get("_frToday"),
      completed: () => have($item`FantasyRealm G. E. M.`),
      do: () => {
        visitUrl("place.php?whichplace=realm_fantasy&action=fr_initcenter");
        runChoice(-1);
      },
      choices: { 1280: 1 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Mumming Trunk",
      after: [],
      priority: () => Priorities.Free,
      completed: () => !have($item`mumming trunk`) || get("_mummeryUses").includes("2,"),
      do: () => cliExecute("mummery mp"),
      outfit: { familiar: $familiar`Grey Goose` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Workshed",
      after: [],
      priority: () => Priorities.Free,
      completed: () =>
        getWorkshed() !== $item`none` || !have(args.major.workshed) || myTurncount() >= 1000,
      do: () => use(args.major.workshed),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Swap Workshed",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        get("_coldMedicineConsults") >= 5 && getWorkshed() === $item`cold medicine cabinet`,
      completed: () =>
        !have(args.major.swapworkshed) || get("_workshedItemUsed") || myTurncount() >= 1000,
      do: () => use(args.major.swapworkshed),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Bugbear Outfit",
      after: [],
      priority: () => Priorities.Free,
      ready: () => myMeat() >= 140,
      completed: () =>
        (!have($item`Asdon Martin keyfob`) && !AsdonMartin.installed()) ||
        !knollAvailable() ||
        (have($item`bugbear beanie`) && have($item`bugbear bungguard`)) ||
        myAscensions() >= 10,
      do: () => {
        retrieveItem($item`bugbear beanie`);
        retrieveItem($item`bugbear bungguard`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Break Stone",
      after: [],
      priority: () => Priorities.Free,
      completed: () => hippyStoneBroken(),
      ready: () => args.minor.pvp,
      do: (): void => {
        visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        visitUrl("peevpee.php?place=fight");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Autumnaton",
      after: [],
      priority: () => Priorities.Free,
      ready: () => AutumnAton.available(),
      completed: () => !AutumnAton.have(),
      do: () => {
        // Refresh upgrades
        AutumnAton.upgrade();

        const upgrades = AutumnAton.currentUpgrades();
        const zones = [];
        if (!upgrades.includes("leftleg1")) {
          // Low underground locations
          zones.push($location`Guano Junction`, $location`Cobb's Knob Harem`, $location`Noob Cave`);
        }
        if (!upgrades.includes("rightleg1")) {
          // Mid indoor locations
          zones.push(
            $location`The Laugh Floor`,
            $location`The Haunted Library`,
            $location`The Haunted Kitchen`
          );
        }

        if (!upgrades.includes("leftarm1")) {
          // Low indoor locations
          zones.push($location`The Haunted Pantry`);
        }
        if (!upgrades.includes("rightarm1")) {
          // Mid outdoor locations
          zones.push($location`The Smut Orc Logging Camp`, $location`The Goatlet`);
        }

        // Valuble quest locations
        if (
          itemAmount($item`barrel of gunpowder`) < 5 &&
          get("sidequestLighthouseCompleted") === "none"
        )
          zones.push($location`Sonofa Beach`);

        if (itemAmount($item`goat cheese`) < 3 && step("questL08Trapper") < 2)
          zones.push($location`The Goatlet`);

        if (step("questL09Topping") < 1) {
          zones.push($location`The Smut Orc Logging Camp`);
        }

        // Mid underground locations for autumn dollar
        zones.push($location`The Defiled Nook`, $location`Cobb's Knob Menagerie, Level 3`);

        zones.push($location`The Sleazy Back Alley`); // always send it somewhere
        const result = AutumnAton.sendTo(zones);
        if (result) print(`Autumnaton sent to ${result}`);
      },
      limit: { tries: 15, unready: true },
      freeaction: true,
    },
    {
      name: "Saber",
      after: [],
      priority: () => Priorities.Free,
      ready: () => have($item`Fourth of May Cosplay Saber`),
      completed: () => get("_saberMod") !== 0,
      do: (): void => {
        visitUrl("main.php?action=may4");
        // Familiar weight
        runChoice(4);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Grapefruit",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        have($item`filthy corduroys`) &&
        have($item`filthy knitted dread sack`) &&
        step("questL12War") < 1,
      completed: () =>
        !have($familiar`Robortender`) ||
        have($item`grapefruit`) ||
        have($item`drive-by shooting`) ||
        get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
      do: () => retrieveItem($item`grapefruit`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Prepare Robortender",
      after: ["Grapefruit"],
      priority: () => Priorities.Free,
      ready: () =>
        (((have($item`fish head`) && have($item`boxed wine`)) || have($item`piscatini`)) &&
          have($item`grapefruit`)) ||
        have($item`drive-by shooting`),
      completed: () =>
        myTurncount() >= 1000 ||
        get("sidequestNunsCompleted") !== "none" ||
        !have($familiar`Robortender`) ||
        get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
      do: () => {
        retrieveItem($item`drive-by shooting`);
        Robortender.feed($item`drive-by shooting`);
      },
      outfit: { familiar: $familiar`Robortender` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Trainset",
      after: [],
      priority: () => Priorities.Free,
      ready: () =>
        getWorkshed() === $item`model train set` && getTrainsetPositionsUntilConfigurable() === 0,
      completed: () => {
        const config = getTrainsetConfiguration();
        if (!config.includes(TrainsetPiece.ORE) && !haveOre()) return false;
        if (config.includes(TrainsetPiece.ORE) && haveOre()) return false;
        if (!config.includes(TrainsetPiece.SMUT_BRIDGE_OR_STATS) && step("questL09Topping") < 1)
          return false;
        if (config.includes(TrainsetPiece.SMUT_BRIDGE_OR_STATS) && step("questL09Topping") >= 1)
          return false;
        return true;
      },
      do: () => {
        const config: TrainsetPiece[] = [];
        // 1 piece
        config.push(TrainsetPiece.DOUBLE_NEXT_STATION);
        // 1-2 pieces
        if (!have($item`designer sweatpants`)) {
          config.push(TrainsetPiece.EFFECT_MP);
        }
        // 1-3 pieces
        if (step("questL09Topping") < 1 && getTrainsetPosition() >= 30) {
          config.push(TrainsetPiece.SMUT_BRIDGE_OR_STATS);
        }
        // 2-4 pieces
        config.push(TrainsetPiece.GAIN_MEAT);
        // 3-4 pieces
        if (!config.includes(TrainsetPiece.EFFECT_MP)) {
          config.push(TrainsetPiece.EFFECT_MP);
        }
        // 3-4 pieces
        if (step("questL09Topping") < 1 && !config.includes(TrainsetPiece.SMUT_BRIDGE_OR_STATS)) {
          config.push(TrainsetPiece.SMUT_BRIDGE_OR_STATS);
        }
        // 3-5 pieces
        if (!haveOre()) config.push(TrainsetPiece.ORE);
        // 4-6 pieces
        config.push(TrainsetPiece.HOT_RES_COLD_DMG);
        // 5-7 pieces
        config.push(TrainsetPiece.STENCH_RES_SPOOKY_DMG);
        // 6-8 pieces
        config.push(TrainsetPiece.RANDOM_BOOZE);
        // 7-8 pieces
        if (config.length < 8) config.push(TrainsetPiece.DROP_LAST_FOOD_OR_RANDOM);
        // 8 pieces
        if (config.length < 8) config.push(TrainsetPiece.CANDY);
        setTrainsetConfiguration(config);
      },
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Harvest Chateau",
      after: [],
      priority: () => Priorities.Free,
      ready: () => get("chateauAvailable"),
      completed: () => get("_chateauDeskHarvested"),
      do: (): void => {
        visitUrl("place.php?whichplace=chateau&action=chateau_desk2");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Learn About Bugs",
      after: [],
      priority: () => Priorities.Free,
      ready: () => have($item`S.I.T. Course Completion Certificate`),
      completed: () => get("_sitCourseCompleted", true) || have($skill`Insectologist`),
      do: () => use($item`S.I.T. Course Completion Certificate`),
      choices: { [1494]: 2 },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Harvest Rock Garden",
      after: [],
      priority: () => Priorities.Free,
      ready: () => haveInCampground($item`packet of rock seeds`),
      completed: () =>
        !haveInCampground($item`milestone`) || getCampground()[$item`milestone`.name] < 1,
      do: () => {
        visitUrl("campground.php?action=rgarden1&pwd");
        visitUrl("campground.php?action=rgarden2&pwd");
        visitUrl("campground.php?action=rgarden3&pwd");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Leaf Resin",
      priority: () => Priorities.Free,
      ready: () =>
        BurningLeaves.have() && BurningLeaves.numberOfLeaves() >= 50 &&
        turnsPlayed() <= 425,
      completed: () => have($effect`Resined`),
      acquire: [{ item: $item`distilled resin` }],
      do: () => use($item`distilled resin`),
      limit: { tries: 5 },
    },
    {
      name: "Wardrobe-O-Matic",
      priority: () => Priorities.Free,
      ready: () => have($item`wardrobe-o-matic`) && myLevel() >= 20,
      completed: () => have($item`futuristic hat`),
      do: () => use($item`wardrobe-o-matic`),
      limit: { tries: 1 },
    }
  ],
};

export const WandQuest: Quest = {
  name: "Wand",
  tasks: [
    {
      name: "Plus Sign",
      after: [],
      ready: () =>
        myBasestat($stat`muscle`) >= 45 &&
        myBasestat($stat`mysticality`) >= 45 &&
        myBasestat($stat`moxie`) >= 45 &&
        (keyStrategy.useful(Keys.Zap) ||
          args.minor.wand ||
          !globalStateCache.absorb().skillCompleted($skill`Hivemindedness`)),
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
        have($item`soft green echo eyedrop antidote`) && // Antitdote to remove teleportitis afterwards
        (keyStrategy.useful(Keys.Zap) ||
          args.minor.wand ||
          !globalStateCache.absorb().skillCompleted($skill`Hivemindedness`)),
      priority: () =>
        familiarWeight($familiar`Grey Goose`) >= 6 ? Priorities.GoodGoose : Priorities.None,
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
        (keyStrategy.useful(Keys.Zap) === false && !args.minor.wand),
      prepare: () => {
        if (have($item`plus sign`)) use($item`plus sign`);
      },
      do: $location`The Dungeons of Doom`,
      outfit: { modifier: "-combat, init", familiar: $familiar`Grey Goose` },
      combat: new CombatStrategy()
        .banish($monster`Quantum Mechanic`)
        .kill($monsters`mimic, The Master Of Thieves`), // Avoid getting more teleportitis
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
        keyStrategy.useful(Keys.Zap) === false,
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

  // Escape the hidden city alters
  choices[781] = 6;
  choices[783] = 6;
  choices[785] = 6;
  choices[787] = 6;
  if (step("questL11Worship") >= 3) {
    // Escape the hidden heart of the hidden temple
    choices[580] = 3;
  }
  // Exit NEP intro choice
  choices[1322] = 6;
  // Leave the gingerbread city clock alone
  choices[1215] = 2;
  // Leave the daily dungeon alone
  choices[689] = 1;
  choices[690] = 3;
  choices[691] = 3;
  choices[692] = 8;
  choices[693] = 3;
  // Leave the shore alone
  choices[793] = 4;

  const combat = new CombatStrategy();
  const haiku_monsters = [
    $monster`amateur ninja`,
    $monster`ancient insane monk`,
    $monster`ferocious bugbear`,
    $monster`gelatinous cube`,
    $monster`Knob Goblin poseur`,
  ];
  combat.macro(new Macro().attack().repeat(), haiku_monsters);

  return {
    name: "Teleportitis",
    after: ["Wand/Get Teleportitis"],
    ready: () => have($effect`Teleportitis`),
    completed: () => get("lastPlusSignUnlock") === myAscensions(),
    do: $location`The Enormous Greater-Than Sign`,
    post: () => {
      // Some tracking is broken when we encounter it with teleportitis
      if (get("lastEncounter") === "Having a Ball in the Ballroom") set("questM21Dance", "step4");
      if (get("lastEncounter") === "Too Much Humanity" && step("questL11Ron") < 1)
        set("questL11Ron", "step1");
    },
    outfit: { equip: $items`antique machete` },
    combat: combat,
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

export function haveOre() {
  if (step("questL08Trapper") >= 2) return true;
  if (get("trapperOre") !== "") {
    return itemAmount(Item.get(get("trapperOre"))) >= 3;
  }
  return (
    itemAmount($item`asbestos ore`) >= 3 &&
    itemAmount($item`chrome ore`) >= 3 &&
    itemAmount($item`linoleum ore`) >= 3
  );
}

function willWorkshedSwap() {
  return (
    args.major.swapworkshed &&
    getWorkshed() === $item`cold medicine cabinet` &&
    !get("_workshedItemUsed")
  );
}

export function trainSetAvailable() {
  if (getWorkshed() === $item`model train set`) return true;
  if (!have($item`model train set`)) return false;
  if (getWorkshed() === $item`none` && args.major.workshed === $item`model train set`) return true;
  if (args.major.swapworkshed === $item`model train set` && willWorkshedSwap()) return true;
  return false;
}
