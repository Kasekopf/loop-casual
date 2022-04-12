import { CombatStrategy } from "../combat";
import {
  adv1,
  cliExecute,
  itemAmount,
  myBasestat,
  myPrimestat,
  retrieveItem,
  retrievePrice,
  runChoice,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  get,
  getSaleValue,
  have,
  Macro,
  set,
} from "libram";
import { OutfitSpec, Quest, step } from "./structure";

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
        retrieveItem(bestChoice);
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
      ready: () => have($item`flimsy hardwood scraps`) && have($item`SpinMaster™ lathe`),
      completed: () => have($item`birch battery`),
      do: () => {
        cliExecute("acquire birch battery");
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
      name: "Daily Dungeon",
      after: [],
      completed: () => get("dailyDungeonDone") || keyCount() >= 3,
      do: $location`The Daily Dungeon`,
      outfit: { equip: $items`ring of Detect Boring Doors, eleven-foot pole` },
      combat: new CombatStrategy().kill(),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
      limit: { tries: 11 },
    },
    {
      name: "Finish",
      after: ["Daily Dungeon"],
      completed: () => keyCount() >= 3,
      do: (): void => {
        throw "Unable to obtain enough fat loot tokens";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
