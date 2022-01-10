import { CombatStrategy } from "../combat";
import {
  cliExecute,
  itemAmount,
  myDaycount,
  myFullness,
  myInebriety,
  mySpleenUse,
  runChoice,
  useSkill,
} from "kolmafia";
import { $item, $items, $location, $skill, get, have, Macro, set } from "libram";
import { Quest } from "./structure";

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => cliExecute("acquire 1 bitchin' meatcar"),
      cap: 1,
    },
    {
      name: "Unlock Island",
      after: [],
      completed: () =>
        have($item`dingy dinghy`) || have($item`junk junk`) || have($item`skeletal skiff`),
      do: () => cliExecute("acquire skeletal skiff"),
      cap: 1,
    },
    {
      name: "Consume",
      after: ["Manor/Billiards"],
      completed: () =>
        myDaycount() > 1 || myFullness() >= 15 || myInebriety() >= 14 || mySpleenUse() >= 15,
      do: (): void => {
        set("spiceMelangeUsed", true);
        set("currentMojoFilters", 3);
        cliExecute("CONSUME ALL NOMEAT");
        set("spiceMelangeUsed", false);
        set("currentMojoFilters", 0);
      },
      cap: 1,
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
      name: "Deck Key",
      after: [],
      completed: () => get("_deckCardsDrawn") > 0,
      do: () => cliExecute("cheat tower"),
      cap: 1,
    },
    {
      name: "Lockpicking",
      after: ["Deck"],
      completed: () => !have($skill`Lock Picking`) || get("lockPicked"),
      do: (): void => {
        useSkill($skill`Lock Picking`);
        if (!have($item`Boris's key`)) runChoice(1);
        else if (!have($item`Jarlsberg's key`)) runChoice(2);
        else runChoice(3);
      },
      cap: 1,
    },
    {
      name: "Malware",
      after: [],
      acquire: $items`daily dungeon malware`,
      completed: () => get("_dailyDungeonMalwareUsed"),
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
      completed: () => keyCount() > 3,
      do: $location`The Daily Dungeon`,
      equip: $items`ring of Detect Boring Doors, eleven-foot pole`,
      combat: new CombatStrategy().kill(),
      choices: { 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 },
    },
    {
      name: "Finish",
      after: ["Deck", "Lockpicking", "Malware", "Daily Dungeon"],
      completed: () => keyCount() > 3,
      do: (): void => {
        throw "Unable to obtain enough fat loot tokens";
      },
      cap: 1,
    },
  ],
};
