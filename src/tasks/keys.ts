import {
  cliExecute,
  equip,
  equippedItem,
  haveEquipped,
  Item,
  itemAmount,
  runChoice,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $slots,
  get,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { CombatStrategy } from "../combat";
import { Quest, step, Task } from "./structure";
import { OverridePriority } from "../priority";

export enum Keys {
  Deck = "Deck",
  Malware = "Daily Dungeon Malware",
  Dungeon = "Daily Dungeon",
  ZapBoris = "Zap Boris",
  ZapSneaky = "Zap Sneaky",
  ZapJarlsberg = "Zap Jarlsberg",
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
    ready: () =>
      step("questL13Final") !== -1 ||
      (have($item`Pick-O-Matic lockpicks`) &&
        have($item`ring of Detect Boring Doors`) &&
        have($item`eleven-foot pole`)),
    after: ["Pull/daily dungeon malware"],
    completed: () => get("dailyDungeonDone") || get("_dailyDungeonMalwareUsed"),
    prepare: () => {
      set("_loop_gyou_malware_amount", itemAmount($item`daily dungeon malware`));
      if (have($item`Pick-O-Matic lockpicks`)) return;
      if (have($item`Platinum Yendorian Express Card`)) return;
      if (have($item`skeleton bone`) && have($item`loose teeth`)) cliExecute("make * skeleton key");
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
          itemAmount($item`skeleton key`) > 1 ||
          (itemAmount($item`skeleton bone`) > 1 && itemAmount($item`loose teeth`) > 1)
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
    ready: () =>
      step("questL13Final") !== -1 ||
      (have($item`Pick-O-Matic lockpicks`) &&
        have($item`ring of Detect Boring Doors`) &&
        have($item`eleven-foot pole`)),
    after: ["Daily Dungeon Malware"],
    completed: () => get("dailyDungeonDone"),
    prepare: () => {
      if (have($item`Pick-O-Matic lockpicks`)) return;
      if (have($item`Platinum Yendorian Express Card`)) return;
      if (have($item`skeleton bone`) && have($item`loose teeth`)) cliExecute("make * skeleton key");
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
          itemAmount($item`skeleton key`) > 1 ||
          (itemAmount($item`skeleton bone`) > 1 && itemAmount($item`loose teeth`) > 1)
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
    which: Keys.ZapBoris,
    possible: () => get("lastZapperWandExplosionDay") <= 0,
    after: ["Pull/Boris's ring", "Wand/Wand"],
    completed: () => get("lastZapperWandExplosionDay") >= 1 || !have($item`Boris's ring`),
    do: () => {
      unequipAcc($item`Boris's ring`);
      cliExecute("zap Boris's ring");
    },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    which: Keys.ZapJarlsberg,
    possible: () => get("lastZapperWandExplosionDay") <= 0,
    after: ["Pull/Jarlsberg's earring", "Wand/Wand"],
    completed: () => get("lastZapperWandExplosionDay") >= 1 || !have($item`Jarlsberg's earring`),
    do: () => {
      unequipAcc($item`Jarlsberg's earring`);
      cliExecute("zap Jarlsberg's earring");
    },
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    which: Keys.ZapSneaky,
    possible: () => (get("_zapCount") < 2 ? undefined : get("lastZapperWandExplosionDay") <= 0), // Wand might explode
    after: ["Pull/Sneaky Pete's breath spray", "Wand/Wand"],
    completed: () =>
      get("lastZapperWandExplosionDay") >= 1 || !have($item`Sneaky Pete's breath spray`),
    do: () => {
      unequipAcc($item`Sneaky Pete's breath spray`);
      cliExecute("zap Sneaky Pete's breath spray");
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
}
export const keyStrategy = new KeyStrategy(heroKeys);

export const KeysQuest: Quest = {
  name: "Keys",
  tasks: [
    ...keyStrategy.tasks.map((task) => {
      return {
        ...task,
        name: task.which,
        completed: () =>
          task.completed() ||
          keyStrategy.plan.get(task.which) === KeyState.DONE ||
          keyStrategy.plan.get(task.which) === KeyState.UNNEEDED ||
          keyStrategy.plan.get(task.which) === KeyState.IMPOSSIBLE,
        ready: () =>
          (task.ready === undefined || task.ready()) &&
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
      after: ["Open 8-Bit", "Tower/Coronation"],
      completed: () =>
        get("nsTowerDoorKeysUsed").includes("digital key") ||
        have($item`digital key`) ||
        itemAmount($item`white pixel`) +
          Math.min(
            itemAmount($item`blue pixel`),
            itemAmount($item`red pixel`),
            itemAmount($item`green pixel`)
          ) >=
          30,
      do: $location`8-Bit Realm`,
      outfit: { equip: $items`continuum transfunctioner` },
      combat: new CombatStrategy().banish($monster`Bullet Bill`).kill(),
      limit: { soft: 30 },
    },
    {
      name: "Star Key",
      after: ["Giant/Unlock HITS"],
      completed: () =>
        (have($item`star chart`) && itemAmount($item`star`) >= 8 && itemAmount($item`line`) >= 7) ||
        have($item`Richard's star key`) ||
        get("nsTowerDoorKeysUsed").includes("Richard's star key"),
      do: $location`The Hole in the Sky`,
      outfit: { modifier: "item" },
      combat: new CombatStrategy().kill($monster`Astronomer`).killItem(),
      limit: { soft: 20 },
      orbtargets: () => (have($item`star chart`) ? [$monster`Astronomer`] : []),
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

function unequipAcc(acc: Item): void {
  if (!haveEquipped(acc)) return;
  for (const slot of $slots`acc1, acc2, acc3`) {
    if (equippedItem(slot) === acc) equip(slot, $item`none`);
  }
}
