import { CombatStrategy } from "../combat";
import {
  cliExecute,
  itemAmount,
  myDaycount,
  myFullness,
  myInebriety,
  myPrimestat,
  mySpleenUse,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
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
import { Quest } from "./structure";

function max(a: number, b: number) {
  return a > b ? a : b;
}
export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => cliExecute("acquire 1 bitchin' meatcar"),
      cap: 1,
      freeaction: true,
    },
    {
      name: "Unlock Island",
      after: [],
      completed: () =>
        have($item`dingy dinghy`) || have($item`junk junk`) || have($item`skeletal skiff`),
      do: () => cliExecute("acquire skeletal skiff"),
      cap: 1,
      freeaction: true,
    },
    {
      name: "Consume",
      after: ["Manor/Billiards"],
      completed: () =>
        myDaycount() > 1 || myFullness() >= 10 || myInebriety() >= 14 || mySpleenUse() >= 5,
      do: (): void => {
        // Save cleaners for aftercore
        const spice = get("spiceMelangeUsed");
        const mojo = get("currentMojoFilters");
        set("spiceMelangeUsed", true);
        set("currentMojoFilters", 3);
        const food = max(10 - myFullness(), 0);
        const drink = max(15 - myInebriety(), 0);
        const spleen = max(5 - mySpleenUse(), 0);
        cliExecute(`CONSUME ORGANS ${food} ${drink} ${spleen} NOMEAT`);
        set("spiceMelangeUsed", spice);
        set("currentMojoFilters", mojo);
      },
      cap: 1,
      freeaction: true,
    },
    {
      name: "Floundry",
      after: [],
      completed: () => have($item`fish hatchet`),
      do: () => cliExecute("acquire 1 fish hatchet"),
      cap: 1,
      freeaction: true,
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
      cap: 1,
      freeaction: true,
    },
  ],
};

function keyCount(): number {
  let count = itemAmount($item`fat loot token`);
  if (have($item`Boris's key`)) count++;
  if (have($item`Jarlsberg's key`)) count++;
  if (have($item`Sneaky Pete's key`)) count++;
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
      cap: 1,
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
      cap: 1,
      freeaction: true,
    },
    {
      name: "Malware",
      after: [],
      acquire: $items`daily dungeon malware`,
      completed: () => get("_dailyDungeonMalwareUsed") || keyCount() >= 3,
      do: $location`The Daily Dungeon`,
      equip: $items`ring of Detect Boring Doors, eleven-foot pole`,
      combat: new CombatStrategy().macro(
        new Macro()
          .item($item`daily dungeon malware`)
          .attack()
          .repeat()
      ),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
    },
    {
      name: "Daily Dungeon",
      after: ["Deck", "Lockpicking", "Malware"],
      completed: () => keyCount() >= 3,
      do: $location`The Daily Dungeon`,
      equip: $items`ring of Detect Boring Doors, eleven-foot pole`,
      combat: new CombatStrategy().kill(),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
    },
    {
      name: "Finish",
      after: ["Deck", "Lockpicking", "Malware", "Daily Dungeon"],
      completed: () => keyCount() >= 3,
      do: (): void => {
        throw "Unable to obtain enough fat loot tokens";
      },
      cap: 1,
      freeaction: true,
    },
  ],
};
