import { buy, create, myHash, runChoice, use, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  ensureEffect,
  get,
  have,
  uneffect,
} from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

function shenItem(item: Item) {
  return (
    get("shenQuestItem") === item.name &&
    (step("questL11Shen") === 1 || step("questL11Shen") === 3 || step("questL11Shen") === 5)
  );
}

const Copperhead: Task[] = [
  {
    name: "Copperhead Start",
    after: ["Macguffin/Diary"],
    completed: () => step("questL11Shen") >= 1,
    do: $location`The Copperhead Club`,
    choices: { 1074: 1 },
    cap: 1,
  },
  {
    name: "Copperhead",
    after: ["Copperhead Start"],
    ready: () =>
      step("questL11Shen") === 2 || step("questL11Shen") === 4 || step("questL11Shen") === 6,
    completed: () => step("questL11Shen") === 999,
    do: $location`The Copperhead Club`,
    choices: { 852: 1, 853: 1, 854: 1 },
    cap: 16,
  },
  {
    name: "Bat Snake",
    after: ["Copperhead Start", "Bat/Use Sonar"],
    ready: () => shenItem($item`The Stankara Stone`),
    completed: () => step("questL11Shen") === 999 || have($item`The Stankara Stone`),
    do: $location`The Batrat and Ratbat Burrow`,
    combat: new CombatStrategy().kill($monster`Batsnake`),
    delay: 5,
  },
  {
    name: "Cold Snake",
    after: ["Copperhead Start", "McLargeHuge/Ores"],
    ready: () => shenItem($item`The First Pizza`),
    completed: () => step("questL11Shen") === 999 || have($item`The First Pizza`),
    do: $location`Lair of the Ninja Snowmen`,
    combat: new CombatStrategy().kill($monster`Frozen Solid Snake`),
    delay: 5,
  },
  {
    name: "Hot Snake Precastle",
    after: ["Copperhead Start", "Giant/Ground"],
    ready: () => shenItem($item`Murphy's Rancid Black Flag`) && step("questL10Garbage") < 10,
    completed: () => step("questL11Shen") === 999 || have($item`Murphy's Rancid Black Flag`),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    equip: $items`Mohawk wig`,
    modifier: "-combat",
    choices: { 675: 4, 676: 4, 677: 4, 678: 1, 679: 1, 1431: 4 },
    combat: new CombatStrategy().kill($monster`Burning Snake of Fire`),
    delay: 5,
  },
  {
    name: "Hot Snake Postcastle",
    after: ["Copperhead Start", "Giant/Ground"],
    ready: () => shenItem($item`Murphy's Rancid Black Flag`) && step("questL10Garbage") >= 10,
    completed: () => step("questL11Shen") === 999 || have($item`Murphy's Rancid Black Flag`),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    modifier: "+combat",
    combat: new CombatStrategy().kill($monster`Burning Snake of Fire`),
    delay: 5,
  },
];

const Zepplin: Task[] = [
  {
    name: "Protesters",
    after: ["Macguffin/Diary"],
    completed: () => step("questL11Ron") >= 2,
    acquire: $items`11-leaf clover`,
    prepare: (): void => {
      ensureEffect($effect`Dirty Pear`);
      if (get("zeppelinProtestors") < 80) {
        use($item`11-leaf clover`);
      }
    },
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy().killHard($monster`The Nuge`),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    modifier: "sleaze dmg, sleaze spell dmg",
    freeaction: true, // fully maximize outfit
  },
  {
    name: "Zepplin",
    after: ["Protesters"],
    acquire: $items`glark cable`,
    completed: () => step("questL11Ron") >= 5,
    ready: () => get("_glarkCableUses") < 5,
    prepare: () => {
      if (!have($item`Red Zeppelin ticket`)) buy($item`Red Zeppelin ticket`);
    },
    do: $location`The Red Zeppelin`,
    combat: new CombatStrategy()
      .kill($monster`Ron "The Weasel" Copperhead`)
      .banish(...$monsters`Red Herring, Red Snapper`)
      .item($item`glark cable`, ...$monsters`man with the red buttons, red skeleton, red butler`),
  },
  {
    name: "Zepplin NoGlark",
    after: ["Protesters"],
    completed: () => step("questL11Ron") >= 5,
    ready: () => get("_glarkCableUses") >= 5,
    prepare: () => {
      if (!have($item`Red Zeppelin ticket`)) buy($item`Red Zeppelin ticket`);
    },
    do: $location`The Red Zeppelin`,
    combat: new CombatStrategy()
      .kill($monster`Ron "The Weasel" Copperhead`)
      .banish(...$monsters`Red Herring, Red Snapper`)
      .kill(...$monsters`man with the red buttons, red skeleton, red butler`),
  },
];

const Dome: Task[] = [
  {
    name: "Talisman",
    after: ["Copperhead", "Zepplin"],
    completed: () => have($item`Talisman o' Namsilat`),
    do: () => create($item`Talisman o' Namsilat`),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Palindome Dog",
    after: ["Talisman"],
    acquire: $items`disposable instant camera`,
    completed: () => have($item`photograph of a dog`) || step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    equip: $items`Talisman o' Namsilat`,
    combat: new CombatStrategy()
      .banish(...$monsters`Evil Olive, Flock of Stab-bats, Taco Cat, Tan Gnat`)
      .item($item`disposable instant camera`, ...$monsters`Bob Racecar, Racecar Bob`)
      .kill(),
    modifier: "-combat",
  },
  {
    name: "Palindome Dudes",
    after: ["Palindome Dog"],
    completed: () => have(Item.get(7262)) || step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    equip: $items`Talisman o' Namsilat`,
    combat: new CombatStrategy()
      .banish(...$monsters`Evil Olive, Flock of Stab-bats, Taco Cat, Tan Gnat`)
      .kill(),
    modifier: "-combat",
  },
  {
    name: "Palindome Photos",
    after: ["Palindome Dudes"],
    completed: () =>
      (have($item`photograph of a red nugget`) &&
        have($item`photograph of God`) &&
        have($item`photograph of an ostrich egg`)) ||
      step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    equip: $items`Talisman o' Namsilat`,
    modifier: "-combat",
  },
  {
    name: "Alarm Gem",
    after: ["Palindome Photos"],
    completed: () => step("questL11Palindome") >= 3,
    do: () => {
      if (have(Item.get(7262))) use(Item.get(7262));
      visitUrl("place.php?whichplace=palindome&action=pal_droffice");
      visitUrl(
        `choice.php?pwd=${myHash()}&whichchoice=872&option=1&photo1=2259&photo2=7264&photo3=7263&photo4=7265`
      );
      use(1, Item.get(7270));
      visitUrl("place.php?whichplace=palindome&action=pal_mroffice");
      visitUrl("clan_viplounge.php?action=hottub");
      uneffect($effect`Beaten Up`);
    },
    equip: $items`Talisman o' Namsilat`,
    freeaction: true,
  },
  {
    name: "Open Alarm",
    after: ["Alarm Gem"],
    completed: () => step("questL11Palindome") >= 5,
    do: () => {
      if (!have($item`wet stunt nut stew`)) create($item`wet stunt nut stew`);
      visitUrl("place.php?whichplace=palindome&action=pal_mrlabel");
    },
    equip: $items`Talisman o' Namsilat`,
    freeaction: true,
  },
];

export const PalindomeQuest: Quest = {
  name: "Palindome",
  tasks: [
    ...Copperhead,
    ...Zepplin,
    ...Dome,
    {
      name: "Boss",
      after: ["Open Alarm"],
      completed: () => step("questL11Palindome") === 999,
      do: (): void => {
        visitUrl("place.php?whichplace=palindome&action=pal_drlabel");
        runChoice(-1);
      },
      equip: $items`Talisman o' Namsilat, Mega Gem`,
      choices: { 131: 1 },
      combat: new CombatStrategy(true).kill(),
      cap: 1,
    },
  ],
};
