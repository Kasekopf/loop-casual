import {
  buy,
  cliExecute,
  equip,
  equippedItem,
  haveEquipped,
  Item,
  itemAmount,
  mallPrice,
  myBasestat,
  myTurncount,
  runChoice,
  storageAmount,
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
  $slots,
  $stat,
  get,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { CombatStrategy } from "../combat";
import { Quest, step, Task } from "./structure";
import { OverridePriority } from "../priority";
import { GameState } from "../state";
import { towerReady, towerSkip } from "./level13";

export enum Keys {
  Deck = "Deck",
  Malware = "Daily Dungeon Malware",
  Dungeon = "Daily Dungeon",
  Fantasy = "Fantasy",
  Zap = "Zap",
}

type KeyTask = Omit<Task, "name"> & { which: Keys; possible: () => boolean | undefined };
const heroKeys: KeyTask[] = [
  {
    which: Keys.Deck,
    possible: () => have($item`Deck of Every Card`) && get("_deckCardsDrawn") === 0,
    after: [],
    priority: () => OverridePriority.Free,
    completed: () => get("_deckCardsDrawn") > 0 || !have($item`Deck of Every Card`),
    do: () => {
      cliExecute("cheat tower");
      if (get("_deckCardsDrawn") <= 10) cliExecute("cheat sheep");
      if (get("_deckCardsDrawn") <= 10) cliExecute("cheat mine");
    },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    which: Keys.Malware,
    possible: () => !get("dailyDungeonDone") && !get("_dailyDungeonMalwareUsed"),
    acquire: [
      { item: $item`daily dungeon malware` },
      { item: $item`Pick-O-Matic lockpicks`, optional: true },
      { item: $item`eleven-foot pole`, optional: true },
      { item: $item`ring of Detect Boring Doors`, optional: true },
    ],
    ready: () =>
      (step("questL13Final") !== -1 ||
        (have($item`Pick-O-Matic lockpicks`) &&
          have($item`ring of Detect Boring Doors`) &&
          have($item`eleven-foot pole`))) && towerReady(),
    after: [],
    completed: () => get("dailyDungeonDone") || get("_dailyDungeonMalwareUsed"),
    prepare: () => {
      set("_loop_gyou_malware_amount", itemAmount($item`daily dungeon malware`));
      if (have($item`Pick-O-Matic lockpicks`)) return;
      if (have($item`Platinum Yendorian Express Card`)) return;
      if (have($item`skeleton bone`) && have($item`loose teeth`) && !have($item`skeleton key`)) cliExecute("make skeleton key");
    },
    do: $location`The Daily Dungeon`,
    post: () => {
      if (itemAmount($item`daily dungeon malware`) < get("_loop_gyou_malware_amount", 0))
        set("_dailyDungeonMalwareUsed", true);
      uneffect($effect`Apathy`);
    },
    outfit: { equip: $items`ring of Detect Boring Doors`, modifier: "init" }, // Avoid apathy
    combat: new CombatStrategy().macro(new Macro().item($item`daily dungeon malware`)).kill(),
    choices: {
      689: 1,
      690: () => (have($item`ring of Detect Boring Doors`) ? 2 : 3),
      691: () => 3, // Do not skip the second chest; there is a chance we skip all the monsters
      692: () => {
        if (have($item`Pick-O-Matic lockpicks`)) return 3;
        if (have($item`Platinum Yendorian Express Card`)) return 7;
        if (
          itemAmount($item`skeleton key`) + min(itemAmount($item`skeleton bone`), itemAmount($item`loose teeth`)) > 1
        )
          return 2;
        if (have($item`skeleton key`) && get("nsTowerDoorKeysUsed").includes("skeleton key"))
          return 2;
        return 4;
      },
      693: () => (have($item`eleven-foot pole`) ? 2 : 1),
    },
    limit: { tries: 15 },
  },
  {
    which: Keys.Dungeon,
    possible: () => !get("dailyDungeonDone"),
    acquire: [
      { item: $item`Pick-O-Matic lockpicks`, optional: true },
      { item: $item`eleven-foot pole`, optional: true },
      { item: $item`ring of Detect Boring Doors`, optional: true },
    ],
    ready: () =>
      (step("questL13Final") !== -1 ||
        (have($item`Pick-O-Matic lockpicks`) &&
          have($item`ring of Detect Boring Doors`) &&
          have($item`eleven-foot pole`))) && towerReady(),
    after: ["Daily Dungeon Malware"],
    completed: () => get("dailyDungeonDone"),
    prepare: () => {
      if (have($item`Pick-O-Matic lockpicks`)) return;
      if (have($item`Platinum Yendorian Express Card`)) return;
      if (have($item`skeleton bone`) && have($item`loose teeth`) && !have($item`skeleton key`)) cliExecute("make skeleton key");
    },
    do: $location`The Daily Dungeon`,
    post: () => {
      uneffect($effect`Apathy`);
    },
    outfit: { equip: $items`ring of Detect Boring Doors`, modifier: "init" }, // Avoid apathy
    combat: new CombatStrategy().kill(),
    choices: {
      689: 1,
      690: () => (have($item`ring of Detect Boring Doors`) ? 2 : 3),
      691: () => (have($item`ring of Detect Boring Doors`) ? 2 : 3),
      692: () => {
        if (have($item`Pick-O-Matic lockpicks`)) return 3;
        if (have($item`Platinum Yendorian Express Card`)) return 7;
        if (
          itemAmount($item`skeleton key`) + min(itemAmount($item`skeleton bone`), itemAmount($item`loose teeth`)) > 1
        )
          return 2;
        if (have($item`skeleton key`) && get("nsTowerDoorKeysUsed").includes("skeleton key"))
          return 2;
        return 4;
      },
      693: () => (have($item`eleven-foot pole`) ? 2 : 1),
    },
    limit: { tries: 15 },
  },
  {
    which: Keys.Fantasy,
    possible: () => get("frAlways") || get("_frToday"),
    after: ["Misc/Open Fantasy"],
    ready: () => myBasestat($stat`moxie`) >= 120,
    completed: () => $location`The Bandit Crossroads`.turnsSpent >= 5,
    do: $location`The Bandit Crossroads`,
    outfit: {
      familiar: $familiar`none`,
      equip: $items`FantasyRealm G. E. M.`,
      modifier: "moxie",
    },
    combat: new CombatStrategy().kill(),
    limit: { tries: 5 },
  },
  {
    which: Keys.Zap,
    possible: () => get("lastZapperWandExplosionDay") <= 0,
    after: ["Wand/Wand"],
    ready: () => towerReady(),
    completed: () =>
      get("lastZapperWandExplosionDay") >= 1 || get("_zapCount") >= 1,
    do: () => {
      unequipAcc(keyStrategy.getZapChoice());
      if (!have(keyStrategy.getZapChoice()) && myTurncount() >= 1000) buy(keyStrategy.getZapChoice(), 1, 100000);
      cliExecute(`zap ${keyStrategy.getZapChoice()}`)
    },
    limit: { tries: 1 },
    freeaction: true,
  },
];

enum KeyState {
  DONE = "Done",
  READY = "Ready",
  MAYBE = "Maybe",
  UNNEEDED = "Unneeded",
  IMPOSSIBLE = "Impossible",
}

class KeyStrategy {
  plan = new Map<Keys, KeyState>();
  tasks: KeyTask[];
  zap_choice?: Item;

  constructor(tasks: KeyTask[]) {
    this.tasks = tasks;
  }

  public update(): void {
    const keysNeeded = Math.max(0, 3 - keyCount());

    let sureKeys = 0; // Number of keys we have definitely planned.
    let maybeKeys = 0; // Number of keys we plan to attempt if possible.
    for (const task of this.tasks) {
      // If we have already guaranteed all keys, no more are needed
      if (sureKeys >= keysNeeded) {
        this.plan.set(task.which, KeyState.UNNEEDED);
        continue;
      }

      switch (task.possible()) {
        case false:
          // This key is impossible to get.
          this.plan.set(task.which, KeyState.IMPOSSIBLE);
          break;
        case true:
          // If all the maybe-keys above succeed, then there is no need for this key. So set our state to maybe.
          // If there are not enough maybe-keys above, then we plan to do this key.
          this.plan.set(task.which, maybeKeys < keysNeeded ? KeyState.READY : KeyState.MAYBE);
          sureKeys++;
          maybeKeys++;
          break;
        case undefined:
          // The key is maybe possible to get.
          this.plan.set(task.which, KeyState.MAYBE);
          maybeKeys++;
      }
    }

    if (sureKeys < keysNeeded) {
      const info = Array.from(this.plan.entries())
        .map((keyinfo) => keyinfo.join("="))
        .join("; ");
      throw `Can only guarantee ${sureKeys} of ${keysNeeded} keys. (${info})`;
    }
  }

  public useful(key: Keys): boolean | undefined {
    if (this.plan.get(key) === KeyState.READY) return true;
    if (this.plan.get(key) === KeyState.MAYBE) return undefined;
    return false;
  }

  public getZapChoice(): Item {
    if (!this.zap_choice) {
      this.zap_choice = makeZapChoice();
    }
    return this.zap_choice;
  }
}
export const keyStrategy = new KeyStrategy(heroKeys);

export const KeysQuest: Quest = {
  name: "Keys",
  tasks: [
    ...keyStrategy.tasks.map((task) => {
      return {
        ...task,
        name: task.which,
        completed: (state: GameState) =>
          task.completed(state) ||
          keyStrategy.plan.get(task.which) === KeyState.DONE ||
          keyStrategy.plan.get(task.which) === KeyState.UNNEEDED ||
          keyStrategy.plan.get(task.which) === KeyState.IMPOSSIBLE,
        ready: (state: GameState) =>
          (task.ready === undefined || task.ready(state)) &&
          keyStrategy.plan.get(task.which) === KeyState.READY,
      };
    }),
    {
      name: "All Heroes",
      after: keyStrategy.tasks.map((task) => task.which),
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
      ready: () => step("questL13Final") > 2 || !have($item`Powerful Glove`),
      completed: () =>
        get("nsTowerDoorKeysUsed").includes("digital key") ||
        have($item`digital key`) ||
        (itemAmount($item`white pixel`) +
          Math.min(
            itemAmount($item`blue pixel`),
            itemAmount($item`red pixel`),
            itemAmount($item`green pixel`)
          ) >=
          30) ||
        towerSkip(),
      do: $location`8-Bit Realm`,
      outfit: { equip: $items`continuum transfunctioner`, modifier: "item", avoid: $items`broken champagne bottle` },
      combat: new CombatStrategy().kill(),
      limit: { soft: 40 },
    },
    {
      name: "Star Key",
      after: ["Giant/Unlock HITS"],
      completed: () =>
        (have($item`star chart`) && itemAmount($item`star`) >= 8 && itemAmount($item`line`) >= 7) ||
        have($item`Richard's star key`) ||
        get("nsTowerDoorKeysUsed").includes("Richard's star key") ||
        towerSkip(),
      do: $location`The Hole in the Sky`,
      outfit: { modifier: "item", avoid: $items`broken champagne bottle`, },
      combat: new CombatStrategy().kill($monster`Astronomer`).killItem(),
      limit: { soft: 20 },
      orbtargets: () => (!have($item`star chart`) ? [$monster`Astronomer`] : []),
    },
    {
      name: "Skeleton Key",
      after: ["Crypt/Nook Boss", "Tower/Start"],
      prepare: () => {
        if (step("questM23Meatsmith") === -1) {
          visitUrl("shop.php?whichshop=meatsmith");
          visitUrl("shop.php?whichshop=meatsmith&action=talk");
          runChoice(1);
        }
      },
      completed: () =>
        (have($item`skeleton bone`) && have($item`loose teeth`)) ||
        have($item`skeleton key`) ||
        get("nsTowerDoorKeysUsed").includes("skeleton key") ||
        towerSkip(),
      outfit: { modifier: "item", avoid: $items`broken champagne bottle`, },
      combat: new CombatStrategy()
        .killItem(...$monsters`factory-irregular skeleton, remaindered skeleton, swarm of skulls`)
        .banish($monster`novelty tropical skeleton`),
      do: $location`The Skeleton Store`,
      limit: { soft: 10 },
    },
  ],
};

function keyCount(): number {
  let count = itemAmount($item`fat loot token`);
  if (towerSkip()) count += storageAmount($item`fat loot token`);
  if (have($item`Boris's key`) || get("nsTowerDoorKeysUsed").includes("Boris")) count++;
  if (have($item`Jarlsberg's key`) || get("nsTowerDoorKeysUsed").includes("Jarlsberg")) count++;
  if (have($item`Sneaky Pete's key`) || get("nsTowerDoorKeysUsed").includes("Sneaky Pete")) count++;
  return count;
}

function unequipAcc(acc: Item): void {
  if (!haveEquipped(acc)) return;
  for (const slot of $slots`acc1, acc2, acc3`) {
    if (equippedItem(slot) === acc) equip(slot, $item`none`);
  }
}

function makeZapChoice(): Item {
  const options = $items`Boris's ring, Jarlsberg's earring, Sneaky Pete's breath spray`;
  for (const option of options) if (have(option)) return option;
  for (const option of options) if (storageAmount(option) > 0) return option;
  // If we don't have any of the zappables, just buy the lowest priced one
  return options.sort((i, j) => mallPrice(i) - mallPrice(j))[0];
}

function min(a: number, b: number) {
  return a < b ? a : b;
}
