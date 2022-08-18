import {
  canEquip,
  create,
  Item,
  itemAmount,
  myBasestat,
  myDaycount,
  myHash,
  myMaxhp,
  restoreHp,
  runChoice,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $stat,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";
import { fillHp } from "./level13";

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
    prepare: () => {
      if (have($item`crappy waiter disguise`))
        ensureEffect($effect`Crappily Disguised as a Waiter`);
    },
    do: $location`The Copperhead Club`,
    combat: new CombatStrategy().killItem(
      $monster`Copperhead Club bartender`,
      $monster`ninja dressed as a waiter`,
      $monster`waiter dressed as a ninja`
    ),
    choices: {
      852: 1,
      853: 1,
      854: 1,
      855: () => {
        return get("copperheadClubHazard") !== "lantern" ? 3 : 4;
      },
    },
    limit: { tries: 30 },  // Extra waiter disguise adventures
  },
  {
    name: "Bat Snake",
    after: ["Copperhead Start", "Bat/Use Sonar 1"],
    ready: () => shenItem($item`The Stankara Stone`) &&
      ($location`The Batrat and Ratbat Burrow`.turnsSpent < 5 || myBasestat($stat`Moxie`) >= 200),
    completed: () =>
      step("questL11Shen") === 999 ||
      have($item`The Stankara Stone`) ||
      (myDaycount() === 1 && step("questL11Shen") > 1),
    do: $location`The Batrat and Ratbat Burrow`,
    combat: new CombatStrategy().killHard($monster`Batsnake`).killItem(),
    outfit: { modifier: "item" },
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Cold Snake",
    after: ["Copperhead Start", "McLargeHuge/Trapper Return", "Summon/White Lion"],
    ready: () => shenItem($item`The First Pizza`),
    completed: () =>
      step("questL11Shen") === 999 ||
      have($item`The First Pizza`) ||
      (myDaycount() === 1 && step("questL11Shen") > 3),
    prepare: () => {
      restoreHp(myMaxhp());
    },
    do: $location`Lair of the Ninja Snowmen`,
    outfit: { modifier: "50 combat, init" },
    combat: new CombatStrategy().killHard(
      $monster`Frozen Solid Snake`,
      $monster`ninja snowman assassin`
    ),
    orbtargets: () => [], // no assassins in orbs
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Hot Snake Precastle",
    after: ["Copperhead Start", "Giant/Ground"],
    acquire: [{ item: $item`Mohawk wig` }],
    ready: () =>
      shenItem($item`Murphy's Rancid Black Flag`) && !have($item`steam-powered model rocketship`),
    completed: () => step("questL11Shen") === 999 || have($item`Murphy's Rancid Black Flag`),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    outfit: { equip: $items`Mohawk wig`, modifier: "-combat" },
    choices: {
      675: 4,
      676: 4,
      677: () => {
        return step("questL10Garbage") >= 10 ? 2 : 1;
      },
      678: () => {
        return step("questL10Garbage") >= 10 ? 3 : 1;
      },
      679: 1,
      1431: 4,
    },
    combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Hot Snake Postcastle",
    after: ["Copperhead Start", "Giant/Ground"],
    ready: () =>
      shenItem($item`Murphy's Rancid Black Flag`) && have($item`steam-powered model rocketship`),
    completed: () => step("questL11Shen") === 999 || have($item`Murphy's Rancid Black Flag`),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    choices: { 675: 4, 676: 4, 677: 1, 678: 1, 679: 1, 1431: 4 },
    outfit: { modifier: "+combat" },
    combat: new CombatStrategy().killHard($monster`Burning Snake of Fire`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Sleaze Star Snake",
    after: ["Copperhead Start", "Giant/Unlock HITS"],
    ready: () =>
      shenItem($item`The Eye of the Stars`),
    completed: () => step("questL11Shen") === 999 || have($item`The Eye of the Stars`),
    do: $location`The Hole in the Sky`,
    combat: new CombatStrategy().killHard($monster`The Snake With Like Ten Heads`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Sleaze Frat Snake",
    after: ["Copperhead Start"],
    ready: () =>
      shenItem($item`The Lacrosse Stick of Lacoronado`),
    completed: () => step("questL11Shen") === 999 || have($item`The Lacrosse Stick of Lacoronado`),
    do: $location`The Smut Orc Logging Camp`,
    combat: new CombatStrategy().killHard($monster`The Frattlesnake`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Spooky Snake Precrypt",
    after: ["Copperhead Start"],
    ready: () =>
      shenItem($item`The Shield of Brook`) && step("questL07Cyrptic") < 999,
    completed: () => step("questL11Shen") === 999 || have($item`The Shield of Brook`),
    do: $location`The Unquiet Garves`,
    combat: new CombatStrategy().killHard($monster`Snakeleton`),
    limit: { soft: 10 },
    delay: 5,
  },
  {
    name: "Spooky Snake Postcrypt",
    after: ["Copperhead Start"],
    ready: () =>
      shenItem($item`The Shield of Brook`) && step("questL07Cyrptic") === 999,
    completed: () => step("questL11Shen") === 999 || have($item`The Shield of Brook`),
    do: $location`The VERY Unquiet Garves`,
    combat: new CombatStrategy().killHard($monster`Snakeleton`),
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
    after: ["Protesters Start", "Misc/Hermit Clover", "McLargeHuge/Clover Ore"],
    ready: () =>
      canEquip($item`transparent pants`) &&
      (itemAmount($item`11-leaf clover`) > 1 ||
        (have($item`Flamin' Whatshisname`) || step("questL11Shen") === 999)),
    prepare: () => {
      if (have($item`lynyrd musk`)) ensureEffect($effect`Musky`);
      if (itemAmount($item`11-leaf clover`) > 1 && !have($effect`Lucky!`))
        use($item`11-leaf clover`);
    },
    completed: () => get("zeppelinProtestors") >= 80,
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy()
      .macro(new Macro().tryItem($item`cigarette lighter`))
      .killHard($monster`The Nuge`)
      .killItem($monster`Blue Oyster cultist`)
      .killItem($monster`lynyrd skinner`)
      .kill(),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    outfit: () => {
      const sleazeitems = $items`deck of lewd playing cards`;
      if (have($item`designer sweatpants`)) sleazeitems.push($item`designer sweatpants`);
      else if (have($item`transparent pants`)) sleazeitems.push($item`transparent pants`);

      if (itemAmount($item`11-leaf clover`) > 1 || have($effect`Lucky!`))
        return {
          modifier: "sleaze dmg, sleaze spell dmg",
          equip: sleazeitems,
          skipDefaults: true,
        };
      return {
        modifier: "-combat, sleaze dmg, sleaze spell dmg",
        equip: sleazeitems,
      };
    },
    limit: { soft: 30 },
  },
  {
    name: "Protesters Finish",
    after: ["Protesters"],
    completed: () => step("questL11Ron") >= 2,
    do: $location`A Mob of Zeppelin Protesters`,
    combat: new CombatStrategy().killHard($monster`The Nuge`),
    choices: { 856: 1, 857: 1, 858: 1, 866: 2, 1432: 1 },
    limit: { tries: 2 }, // If clovers were used before the intro adventure, we need to clear both the intro and closing advs here.
    freeaction: true,
  },
  {
    name: "Zepplin",
    after: ["Protesters Finish"],
    completed: () => step("questL11Ron") >= 5,
    prepare: () => {
      if (have($item`Red Zeppelin ticket`)) return;
      visitUrl("woods.php");
      visitUrl("shop.php?whichshop=blackmarket");
      visitUrl("shop.php?whichshop=blackmarket&action=buyitem&whichrow=289&ajax=1&quantity=1");
      if (!have($item`Red Zeppelin ticket`))
        throw `Unable to buy Red Zeppelin ticket; please buy manually`;
    },
    do: $location`The Red Zeppelin`,
    combat: new CombatStrategy()
      .kill($monster`Ron "The Weasel" Copperhead`)
      .macro((): Macro => {
        if (get("_glarkCableUses") < 5) return new Macro().tryItem($item`glark cable`);
        else return new Macro();
      }, ...$monsters`man with the red buttons, red skeleton, red butler`)
      .banish(...$monsters`Red Herring, Red Snapper`)
      .kill(),
    limit: { soft: 13 },
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
      "Sleaze Star Snake",
      "Sleaze Frat Snake",
      "Spooky Snake Precrypt",
      "Spooky Snake Postcrypt"
    ],
    completed: () => have($item`Talisman o' Namsilat`),
    do: () => create($item`Talisman o' Namsilat`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Palindome Dog",
    after: ["Talisman", "Manor/Bedroom Camera"],
    completed: () => have($item`photograph of a dog`) || step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    outfit: () => {
      if (have($item`stunt nuts`))
        return { equip: $items`Talisman o' Namsilat`, modifier: "-combat" };
      return { equip: $items`Talisman o' Namsilat`, modifier: "-combat, item" };
    },
    combat: new CombatStrategy()
      .banish(...$monsters`Evil Olive, Flock of Stab-bats, Taco Cat, Tan Gnat`)
      .macro(
        new Macro().item($item`disposable instant camera`),
        ...$monsters`Bob Racecar, Racecar Bob`
      )
      .killItem(...$monsters`Bob Racecar, Racecar Bob`)
      .kill(),
    limit: { soft: 20 },
  },
  {
    name: "Palindome Dudes",
    after: ["Palindome Dog"],
    completed: () => have(Item.get(7262)) || step("questL11Palindome") >= 3,
    do: $location`Inside the Palindome`,
    outfit: () => {
      if (have($item`stunt nuts`))
        return { equip: $items`Talisman o' Namsilat`, modifier: "-combat" };
      return { equip: $items`Talisman o' Namsilat`, modifier: "-combat, item" };
    },
    combat: new CombatStrategy()
      .banish(...$monsters`Evil Olive, Flock of Stab-bats, Taco Cat, Tan Gnat`)
      .killItem(...$monsters`Bob Racecar, Racecar Bob`)
      .kill(),
    limit: { soft: 20 },
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
    outfit: () => {
      if (have($item`stunt nuts`))
        return { equip: $items`Talisman o' Namsilat`, modifier: "-combat" };
      return { equip: $items`Talisman o' Namsilat`, modifier: "-combat, item" };
    },
    combat: new CombatStrategy().killItem(...$monsters`Bob Racecar, Racecar Bob`),
    limit: { soft: 20 },
  },
  {
    name: "Palindome Nuts",
    after: ["Palindome Photos"],
    do: $location`Inside the Palindome`,
    completed: () =>
      have($item`stunt nuts`) || have($item`wet stunt nut stew`) || step("questL11Palindome") >= 5,
    outfit: { equip: $items`Talisman o' Namsilat`, modifier: "item" },
    combat: new CombatStrategy().killItem(...$monsters`Bob Racecar, Racecar Bob`),
    limit: { soft: 20 },
  },
  {
    name: "Alarm Gem",
    after: ["Palindome Dudes", "Palindome Photos"],
    completed: () => step("questL11Palindome") >= 3,
    do: () => {
      if (have(Item.get(7262))) use(Item.get(7262));
      visitUrl("place.php?whichplace=palindome&action=pal_droffice");
      visitUrl(
        `choice.php?pwd=${myHash()}&whichchoice=872&option=1&photo1=2259&photo2=7264&photo3=7263&photo4=7265`
      );
      use(1, Item.get(7270));
      visitUrl("place.php?whichplace=palindome&action=pal_mroffice");
      fillHp();
    },
    outfit: { equip: $items`Talisman o' Namsilat` },
    limit: { tries: 1 },
    freeaction: true,
    expectbeatenup: true,
  },
  {
    name: "Grove",
    after: ["Alarm Gem"],
    completed: () =>
      (have($item`bird rib`) && have($item`lion oil`)) ||
      have($item`wet stew`) ||
      have($item`wet stunt nut stew`) ||
      step("questL11Palindome") >= 5,
    do: $location`Whitey's Grove`,
    outfit: { modifier: "50 combat, item" },
    combat: new CombatStrategy().killItem($monster`whitesnake`).killItem($monster`white lion`),
    limit: { soft: 15 },
  },
  {
    name: "Open Alarm",
    after: ["Alarm Gem", "Palindome Nuts", "Grove"],
    completed: () => step("questL11Palindome") >= 5,
    do: () => {
      if (!have($item`wet stunt nut stew`)) create($item`wet stunt nut stew`);
      visitUrl("place.php?whichplace=palindome&action=pal_mrlabel");
    },
    outfit: { equip: $items`Talisman o' Namsilat` },
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
      outfit: { equip: $items`Talisman o' Namsilat, Mega Gem` },
      choices: { 131: 1 },
      combat: new CombatStrategy(true).kill(),
      limit: { tries: 1 },
    },
  ],
};
