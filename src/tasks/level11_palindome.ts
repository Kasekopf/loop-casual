import { create, Item, myHash, runChoice, use, visitUrl } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
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
    limit: { tries: 1 },
  },
  {
    name: "Copperhead",
    after: ["Copperhead Start"],
    ready: () =>
      step("questL11Shen") === 2 || step("questL11Shen") === 4 || step("questL11Shen") === 6,
    completed: () => step("questL11Shen") === 999,
    do: $location`The Copperhead Club`,
    choices: { 852: 1, 853: 1, 854: 1 },
    limit: { tries: 16 },
  },
  {
    name: "Bat Snake",
    after: ["Copperhead Start", "Bat/Use Sonar"],
    ready: () => shenItem($item`The Stankara Stone`),
    completed: () => step("questL11Shen") === 999 || have($item`The Stankara Stone`),
    do: $location`The Batrat and Ratbat Burrow`,
    combat: new CombatStrategy().killHard($monster`Batsnake`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Cold Snake",
    after: ["Copperhead Start", "McLargeHuge/Ores"],
    ready: () => shenItem($item`The First Pizza`),
    completed: () => step("questL11Shen") === 999 || have($item`The First Pizza`),
    do: $location`Lair of the Ninja Snowmen`,
    combat: new CombatStrategy().killHard($monster`Frozen Solid Snake`).macro((): Macro => {
      if (!have($item`li'l ninja costume`)) return new Macro().attack().repeat();
      else return new Macro();
    }),
    limit: { soft: 10 },
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
    combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Hot Snake Postcastle",
    after: ["Copperhead Start", "Giant/Ground"],
    ready: () => shenItem($item`Murphy's Rancid Black Flag`) && step("questL10Garbage") >= 10,
    completed: () => step("questL11Shen") === 999 || have($item`Murphy's Rancid Black Flag`),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    modifier: "+combat",
    combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
    limit: { soft: 10 },
    delay: 5,
  },
];

const Zepplin: Task[] = [
  {
    name: "Protesters Start",
    after: ["Macguffin/Diary"],
    completed: () => step("questL11Ron") >= 1,
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy().killHard($monster`The Nuge`),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Protesters",
    after: ["Protesters Start"],
    completed: () => get("zeppelinProtestors") >= 80,
    acquire: [{ item: $item`11-leaf clover` }],
    prepare: (): void => {
      if (get("zeppelinProtestors") < 80) {
        if (have($skill`Bend Hell`) && !get("_bendHellUsed")) ensureEffect($effect`Bendin' Hell`);
        ensureEffect($effect`Dirty Pear`);
        use($item`11-leaf clover`);
      }
    },
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy().killHard($monster`The Nuge`),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    modifier: "sleaze dmg, sleaze spell dmg",
    familiar: $familiar`Left-Hand Man`,
    freeaction: true, // fully maximize outfit
    limit: { tries: 3, message: "Maybe your available sleaze damage is too low." },
  },
  {
    name: "Protesters Finish",
    after: ["Protesters"],
    completed: () => step("questL11Ron") >= 2,
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy().killHard($monster`The Nuge`),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Zepplin",
    after: ["Protesters Finish"],
    acquire: [
      { item: $item`glark cable`, useful: () => get("_glarkCableUses") < 5 },
      { item: $item`Red Zeppelin ticket` },
    ],
    completed: () => step("questL11Ron") >= 5,
    do: $location`The Red Zeppelin`,
    combat: new CombatStrategy()
      .kill($monster`Ron "The Weasel" Copperhead`)
      .macro((): Macro => {
        if (get("_glarkCableUses") < 5) return new Macro().tryItem($item`glark cable`);
        else return new Macro();
      }, ...$monsters`man with the red buttons, red skeleton, red butler`)
      .banish(...$monsters`Red Herring, Red Snapper`)
      .kill(),
    limit: { soft: 10 },
  },
];

const Dome: Task[] = [
  {
    name: "Talisman",
    after: [
      "Copperhead",
      "Zepplin",
      "Bat Snake",
      "Cold Snake",
      "Hot Snake Precastle",
      "Hot Snake Postcastle",
    ],
    completed: () => have($item`Talisman o' Namsilat`),
    do: () => create($item`Talisman o' Namsilat`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Palindome Dog",
    after: ["Talisman"],
    acquire: [{ item: $item`disposable instant camera` }],
    completed: () => have($item`photograph of a dog`) || step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    equip: $items`Talisman o' Namsilat`,
    combat: new CombatStrategy()
      .banish(...$monsters`Evil Olive, Flock of Stab-bats, Taco Cat, Tan Gnat`)
      .item($item`disposable instant camera`, ...$monsters`Bob Racecar, Racecar Bob`)
      .kill(),
    limit: { soft: 20 },
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
    limit: { soft: 20 },
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
    limit: { soft: 20 },
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
    limit: { tries: 1 },
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
    limit: { tries: 1 },
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
      limit: { tries: 1 },
    },
  ],
};
