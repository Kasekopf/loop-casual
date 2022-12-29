import {
  adv1,
  buy,
  canFaxbot,
  cliExecute,
  chatPrivate,
  expectedColdMedicineCabinet,
  familiarEquippedEquipment,
  familiarWeight,
  getWorkshed,
  itemAmount,
  Monster,
  myBasestat,
  myLevel,
  myPrimestat,
  retrieveItem,
  retrievePrice,
  runChoice,
  totalTurnsPlayed,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  AutumnAton,
  Clan,
  CombatLoversLocket,
  get,
  getSaleValue,
  have,
  Macro,
  set,
  uneffect,
  SourceTerminal,
  Witchess,
} from "libram";
import { CombatStrategy } from "../engine/combat";
import { Quest } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { args } from "../main";

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => cliExecute("acquire 1 bitchin' meatcar"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Unlock Island",
      after: [],
      completed: () =>
        have($item`dingy dinghy`) ||
        have($item`junk junk`) ||
        have($item`skeletal skiff`) ||
        have($item`yellow submarine`),
      do: () => {
        const options = $items`skeletal skiff, yellow submarine`;
        const bestChoice = options.sort((a, b) => retrievePrice(a) - retrievePrice(b))[0];
        if (bestChoice === $item`yellow submarine`) {
          // Open the mystic store if needed
          if (!have($item`continuum transfunctioner`)) {
            visitUrl("place.php?whichplace=forestvillage&action=fv_mystic");
            runChoice(1);
            runChoice(1);
            runChoice(1);
          }
        }
        retrieveItem(bestChoice);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Floundry",
      after: [],
      completed: () =>
        have($item`fish hatchet`) || get("_loop_casual_floundry_checked", "") === Clan.get().name,
      do: () => {
        const sufficientFish = visitUrl("clan_viplounge.php?action=floundry").match(
          "([0-9]+) hatchetfish"
        );
        if (sufficientFish === null || parseInt(sufficientFish[1]) < 10) {
          // Recheck if the script is rerun with a new clan
          set("_loop_casual_floundry_checked", Clan.get().name);
        } else {
          cliExecute("acquire 1 fish hatchet");
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Short Cook",
      after: [],
      ready: () => have($familiar`Shorter-Order Cook`),
      completed: () =>
        familiarEquippedEquipment($familiar`Shorter-Order Cook`) === $item`blue plate`,
      acquire: [{ item: $item`blue plate` }],
      do: () => useFamiliar($familiar`Mosquito`), // Switch away to keep blue plate equipped
      outfit: { familiar: $familiar`Shorter-Order Cook`, equip: $items`blue plate` },
      freeaction: true,
      limit: { tries: 1 },
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
      name: "Acquire FamEquip",
      after: [],
      ready: () =>
        $items`astral pet sweater, amulet coin, luck incense`.some((item) => !have(item)) &&
        $familiars`Mu, Cornbeefadon`.some(have),
      completed: () =>
        $items`astral pet sweater, amulet coin, luck incense`.some((item) => have(item)) ||
        !$familiars`Mu, Cornbeefadon`.some(have),
      do: () => {
        const famToUse = $familiars`Mu, Cornbeefadon`.find(have);
        if (famToUse) {
          useFamiliar(famToUse);
          retrieveItem($item`box of Familiar Jacks`);
          use($item`box of Familiar Jacks`);
        }
      },
      limit: { tries: 1 },
    },
    {
      name: "Voting",
      after: [],
      ready: () => get("voteAlways"),
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
      name: "CMC Pills",
      ready: () =>
        getWorkshed() === $item`cold medicine cabinet` &&
        (get("_coldMedicineConsults") === 0 ||
          totalTurnsPlayed() >= get("_nextColdMedicineConsult")) &&
        $items`Extrovermectin™`.includes(expectedColdMedicineCabinet().pill),
      completed: () => get("_coldMedicineConsults") >= 5,
      priority: () => true,
      do: () => cliExecute("cmc pill"),
      limit: { tries: 5 },
    },
    {
      name: "Autumn-aton",
      after: [],
      ready: () => have($item`autumn-aton`),
      completed: () => step("questL13Final") >= 0,
      priority: () => true,
      combat: new CombatStrategy().macro(new Macro()).kill(),
      do: () => {
        //make sure all available upgrades are installed
        AutumnAton.upgrade();
        //get upgrades
        if (!AutumnAton.currentUpgrades().includes("leftleg1")) {
          AutumnAton.sendTo($location`Noob Cave`);
        } else if (
          !AutumnAton.currentUpgrades().includes("rightleg1") &&
          AutumnAton.availableLocations().includes($location`The Haunted Kitchen`)
        ) {
          AutumnAton.sendTo($location`The Haunted Kitchen`);
        } else if (!AutumnAton.currentUpgrades().includes("leftarm1")) {
          AutumnAton.sendTo($location`The Haunted Pantry`);
        } else if (
          !AutumnAton.currentUpgrades().includes("rightarm1") &&
          AutumnAton.availableLocations().includes($location`Twin Peak`)
        ) {
          AutumnAton.sendTo($location`Twin Peak`);
        }
        //lighthouse
        else if (
          AutumnAton.currentUpgrades().length >= 4 &&
          step("questL12War") >= 1 &&
          itemAmount($item`barrel of gunpowder`) < 5 &&
          get("sidequestLighthouseCompleted") === "none"
        ) {
          adv1($location`Sonofa Beach`);
          AutumnAton.sendTo($location`Sonofa Beach`);
        }
        //farming
        else if (AutumnAton.availableLocations().includes($location`The Defiled Nook`)) {
          AutumnAton.sendTo($location`The Defiled Nook`);
        }
        //If all else fails, grab an autumn leaf. This shouldn't ever happen
        else {
          AutumnAton.sendTo($location`The Sleazy Back Alley`);
        }
      },
      limit: { tries: 15 },
    },
    {
      name: "Goose Exp",
      after: [],
      priority: () => true,
      completed: () =>
        familiarWeight($familiar`Grey Goose`) >= 9 ||
        get("_loop_casual_chef_goose") === "true" ||
        !have($familiar`Grey Goose`) ||
        !have($familiar`Shorter-Order Cook`),
      do: () => {
        set("_loop_casual_chef_goose", "true");
      },
      outfit: { familiar: $familiar`Grey Goose` },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Workshed",
      after: [],
      priority: () => true,
      completed: () => getWorkshed() !== $item`none` || !have(args.workshed),
      do: () => use(args.workshed),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Setup Digitize",
      ready: () => SourceTerminal.have() && args.digitize && 
                    myLevel() > args.levelto && (!have($familiar`Grey Goose`) || familiarWeight($familiar`Grey Goose`) >= 6),
      completed: () => get("_sourceTerminalDigitizeMonster") === $monster`Witchess Knight`,
      prepare: () =>  {
        if (!SourceTerminal.isCurrentSkill($skill`Digitize`))
          SourceTerminal.educate($skill`Digitize`);
      },
      priority: () => true,
      do: () => {
        if (Witchess.have()){
          Witchess.fightPiece($monster`Witchess Knight`);
        } else if (CombatLoversLocket.have() && CombatLoversLocket.availableLocketMonsters().includes($monster`Witchess Knight`) && 
                    CombatLoversLocket.reminiscesLeft() > 1) {
          CombatLoversLocket.reminisce($monster`Witchess Knight`)
        } else if (!get("_photocopyUsed") && have($item`Clan VIP Lounge key`) && canFaxbot($monster`Witchess Knight`)){
          chatPrivate("cheesefax", "Witchess Knight");
          for(var i = 0; i < 3; i++){
            wait(10);
            if (checkFax($monster`Witchess Knight`)) {
              use($item`photocopied monster`);
              break;
            }
          }
        } 
        if (get("_sourceTerminalDigitizeMonster") != $monster`Witchess Knight`) {
          buy($item`pocket wish`, 1, 50000);
          cliExecute("genie monster witchess knight");
        }
      },
      combat: new CombatStrategy().macro(
        new Macro().trySkill($skill`Digitize`).trySkill($skill`Emit Matter Duplicating Drones`)
        ).killHard(),
      outfit: (): OutfitSpec => {
        if (have($familiar`Grey Goose`)){
          return {
            familiar: $familiar`Grey Goose`,
            // Get 11 famexp at the end of the fight, to maintain goose weight
            offhand: $item`yule hatchet`,
            famequip: $item`grey down vest`,
            acc1: $item`teacher's pen`,
            acc2: $item`teacher's pen`,
            acc3: $item`teacher's pen`,
          }
        } else return {}
      },
      limit: { tries: 1 },
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
      name: "Deck",
      after: [],
      completed: () => get("_deckCardsDrawn") > 0,
      do: () => cliExecute("cheat tower"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Lockpicking",
      after: ["Deck"],
      completed: () => !have($skill`Lock Picking`) || get("lockPicked"),
      do: (): void => {
        useSkill($skill`Lock Picking`);
      },
      choices: {
        1414: (): number => {
          if (!have($item`Boris's key`)) return 1;
          else if (!have($item`Jarlsberg's key`)) return 2;
          else return 3;
        },
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Malware",
      after: [],
      acquire: [
        { item: $item`daily dungeon malware` },
        { item: $item`Pick-O-Matic lockpicks` },
        { item: $item`eleven-foot pole` },
      ],
      completed: () =>
        get("_dailyDungeonMalwareUsed") || get("dailyDungeonDone") || keyCount() >= 3,
      prepare: () => {
        set("_loop_casual_malware_amount", itemAmount($item`daily dungeon malware`));
      },
      do: $location`The Daily Dungeon`,
      post: () => {
        if (itemAmount($item`daily dungeon malware`) < get("_loop_casual_malware_amount", 0))
          set("_dailyDungeonMalwareUsed", true);
        uneffect($effect`Apathy`);
      },
      outfit: {
        equip: $items`ring of Detect Boring Doors`,
        avoid: $items`carnivorous potted plant`,
      },
      combat: new CombatStrategy().macro(
        new Macro()
          .item($item`daily dungeon malware`)
          .attack()
          .repeat()
      ),
      choices: {
        689: 1,
        690: 2,
        691: 3, // Do not skip the second chest; there is a chance we skip all the monsters
        692: 3,
        693: 2,
      },
      limit: { soft: 11 },
    },
    {
      name: "Daily Dungeon",
      after: ["Deck", "Lockpicking", "Malware"],
      acquire: [{ item: $item`Pick-O-Matic lockpicks` }, { item: $item`eleven-foot pole` }],
      completed: () => get("dailyDungeonDone") || keyCount() >= 3,
      do: $location`The Daily Dungeon`,
      post: () => uneffect($effect`Apathy`),
      outfit: {
        equip: $items`ring of Detect Boring Doors`,
      },
      combat: new CombatStrategy().kill(),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
      limit: { tries: 11 },
    },
    {
      name: "Finish",
      after: ["Deck", "Lockpicking", "Malware", "Daily Dungeon"],
      completed: () => keyCount() >= 3,
      do: (): void => {
        throw "Unable to obtain enough fat loot tokens";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

// From garbo
function checkFax(mon: Monster): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (get("photocopyMonster") === mon) return true;
  cliExecute("fax send");
  return false;
}