import { buyUsingStorage, cliExecute, Item, itemAmount, storageAmount } from "kolmafia";
import { $item, $items, get, have } from "libram";
import { args } from "../main";
import { OverridePriority } from "../priority";
import { Quest, step, Task } from "./structure";
import { Keys, keyStrategy } from "./keys";

/**
 * optional: If true, only pull this if there is one in storage (i.e., no mall buy).
 * useful: True if we need it, false if we don't, undefined if not sure yet.
 * pull: The item to pull, or a list of options to pull.
 * name: If a list of options is
 */
type PullSpec = {
  optional?: boolean;
  useful?: () => boolean | undefined;
} & ({ pull: Item } | { pull: Item[] | (() => Item | undefined); name: string });

export const pulls: PullSpec[] = [
  { pull: $item`book of matches` },
  { pull: $item`blackberry galoshes` },
  { pull: $item`antique machete` },
  { pull: $item`ninja rope` },
  { pull: $item`ninja carabiner` },
  { pull: $item`ninja crampons` },
  { pull: $item`wet stew` },
  {
    pull: $item`Mohawk wig`,
    useful: () => (have($item`S.O.C.K.`) ? !have($item`Mohawk wig`) : undefined), // if one didn't drop naturally
  },
  { pull: $items`Space Trip safety headphones, HOA regulation book`, name: "-ML", optional: true },
  { pull: $item`yule hatchet` },
  { pull: $item`grey down vest` },
  { pull: $item`killing jar` },
  { pull: $item`Boris's ring`, useful: () => keyStrategy.useful(Keys.ZapBoris) },
  { pull: $item`Jarlsberg's earring`, useful: () => keyStrategy.useful(Keys.ZapJarlsberg) },
  { pull: $item`Sneaky Pete's breath spray`, useful: () => keyStrategy.useful(Keys.ZapSneaky) },
  { pull: $item`old patched suit-pants`, optional: true },
  { pull: $item`transparent pants`, optional: true },
  { pull: $item`deck of lewd playing cards`, optional: true },
  { pull: $item`11-leaf clover` },
  {
    name: "Ore",
    pull: () => (get("trapperOre") === "" ? undefined : Item.get(get("trapperOre"))),
    useful: () =>
      get("trapperOre") === ""
        ? undefined
        : itemAmount(Item.get(get("trapperOre"))) < 3 && step("questL08Trapper") < 2,
  },
  { pull: $item`mafia thumb ring`, optional: true },
];

class Pull {
  items: () => (Item | undefined)[];
  name: string;
  optional: boolean;
  useful: () => boolean | undefined;

  constructor(spec: PullSpec) {
    if ("name" in spec) {
      this.name = spec.name;
    } else {
      this.name = spec.pull.name;
    }

    const pull = spec.pull;
    this.items =
      pull instanceof Item
        ? () => [pull]
        : typeof pull === "function"
        ? () => [pull()]
        : () => pull;
    this.optional = spec.optional ?? false;
    this.useful = spec.useful ?? (() => true);
  }

  public wasPulled(pulled: Set<Item>) {
    for (const item of this.items()) {
      if (item === undefined) continue;
      if (pulled.has(item)) return true;
    }
    return false;
  }

  public shouldPull(): boolean | undefined {
    const needed = this.useful();
    if (needed === false) return false;
    if (!this.optional) return needed;

    // For optional items, return false if we have none
    // and defer to needed if we have some.
    for (const item of this.items()) {
      if (item === undefined) return undefined; // We don't even know which item yet
      if (storageAmount(item) > 0) return needed;
    }
    return false;
  }

  public pull(): void {
    for (const item of this.items()) {
      if (item === undefined) throw `Unable to pull ${this.name}; the desired item is undefined`;
      if (storageAmount(item) > 0 || buyUsingStorage(1, item, 100000)) {
        cliExecute(`pull ${item.name}`);
        return;
      }
    }
  }
}

enum PullState {
  PULLED,
  READY,
  MAYBE,
  UNNEEDED,
}

class PullStrategy {
  pulls: Pull[];
  enabled: PullState[];

  constructor(pulls: PullSpec[]) {
    this.pulls = pulls.map((pull) => new Pull(pull));
    this.enabled = pulls.map(() => PullState.MAYBE);
  }

  public update(): void {
    const pulled = new Set<Item>(
      get("_roninStoragePulls")
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => id > 0)
        .map((id) => Item.get(id))
    );

    let count = args.pulls - pulled.size;
    for (let i = 0; i < this.pulls.length; i++) {
      if (this.pulls[i].wasPulled(pulled)) {
        this.enabled[i] = PullState.PULLED;
        continue;
      }

      switch (this.pulls[i].shouldPull()) {
        case false:
          this.enabled[i] = PullState.UNNEEDED;
          continue;
        case true:
          this.enabled[i] = count > 0 ? PullState.READY : PullState.MAYBE; // Only pull if there is room in the plan
          count--;
          continue;
        case undefined:
          this.enabled[i] = PullState.MAYBE;
          count;
          continue;
      }
    }
  }
}

export const pullStrategy = new PullStrategy(pulls);
export const PullQuest: Quest = {
  name: "Pull",
  tasks: [
    ...pullStrategy.pulls.map((pull, index): Task => {
      return {
        name: pull.name,
        priority: () => OverridePriority.Free,
        after: [],
        ready: () => pullStrategy.enabled[index] === PullState.READY,
        completed: () =>
          pullStrategy.enabled[index] === PullState.PULLED ||
          pullStrategy.enabled[index] === PullState.UNNEEDED,
        do: () => pull.pull(),
        post: () => {
          pullStrategy.update();
        },
        limit: { tries: 1 },
        freeaction: true,
      };
    }),
    {
      // Add a last task that tracks if all pulls have been done, for routing
      name: "All",
      after: pullStrategy.pulls.map((pull) => pull.name),
      completed: () => true,
      do: (): void => {
        throw `Should never run`;
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
