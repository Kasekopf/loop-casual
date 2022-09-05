import { buyUsingStorage, cliExecute, inHardcore, Item, itemAmount, myMeat, myTurncount, pullsRemaining, retrieveItem, storageAmount } from "kolmafia";
import { $familiar, $item, $items, $skill, get, have } from "libram";
import { args } from "../main";
import { OverridePriority } from "../engine/priority";
import { Quest, step, Task } from "./structure";
import { Keys, keyStrategy } from "./keys";
import { towerSkip } from "./level13";

/**
 * optional: If true, only pull this if there is one in storage (i.e., no mall buy).
 * useful: True if we need it, false if we don't, undefined if not sure yet.
 * duplicate: True if we should pull it even if we have it.
 * pull: The item to pull, or a list of options to pull.
 * name: If a list of options is given, what to use for the task (& sim) name.
 */
type PullSpec = {
  optional?: boolean;
  useful?: () => boolean | undefined;
  duplicate?: boolean;
  post?: () => void;
} & ({ pull: Item } | { pull: Item[] | (() => Item | undefined); name: string });

export const pulls: PullSpec[] = [
  // Always pull the key items first
  { pull: $item`daily dungeon malware`, useful: () => keyStrategy.useful(Keys.Malware) && !towerSkip() },
  { name: "Key Zappable", pull: () => keyStrategy.getZapChoice(), useful: () => keyStrategy.useful(Keys.Zap) && !towerSkip(), duplicate: true },
  {
    name: "Ore",
    pull: () => (get("trapperOre") === "" ? undefined : Item.get(get("trapperOre"))),
    useful: () => {
      if (itemAmount($item`asbestos ore`) >= 3 &&
        itemAmount($item`linoleum ore`) >= 3 &&
        itemAmount($item`chrome ore`) >= 3) return false;
      if (have($item`Deck of Every Card`)) return false;
      if (get("trapperOre") === "") return undefined;
      return itemAmount(Item.get(get("trapperOre"))) < 3 && step("questL08Trapper") < 2;
    },
    duplicate: true,
  },
  {
    pull: $item`1,970 carat gold`,
    useful: () => {
      if (myMeat() < 200 && step("questM05Toot") > 0 && !have($item`letter from King Ralph XI`)) return true;
      if (myMeat() < 4000 && step("questL11Black") === 2 && !have($item`forged identification documents`)) return true;
      if (have($skill`System Sweep`) && have($skill`Double Nanovision`)) return false;  // early run is over
      return undefined;
    },
  },
  {
    pull: $item`1952 Mickey Mantle card`,
    useful: () => {
      if (have($item`forged identification documents`) || step("questL11Black") >= 4) return false;
      if (step("questL11Black") >= 2 && myTurncount() >= 200) return true;
      return undefined;
    },
  },
  {
    pull: $items`Greatest American Pants, navel ring of navel gazing`,
    optional: true,
    name: "Runaway IoTM",
  },
  {
    pull: $item`ring of conflict`, // Last chance for -5% combat frequency
    useful: () =>
      !have($item`unbreakable umbrella`) &&
      !have($item`Space Trip safety headphones`) &&
      storageAmount($item`Space Trip safety headphones`) === 0 &&
      !have($item`protonic accelerator pack`),
  },
  {
    pull: $items`warbear long johns, square sponge pants`,
    useful: () => !have($item`designer sweatpants`),
    optional: true,
    name: "MP Regen Pants"
  },
  {
    pull: $items`plastic vampire fangs, warbear goggles, burning newspaper`,
    useful: () => !have($item`designer sweatpants`) && get("greyYouPoints") < 11 && !have($item`burning paper slippers`),
    optional: true,
    post: () => {
      if (have($item`burning newspaper`)) retrieveItem($item`burning paper slippers`);
    },
    name: "Max HP with low path progression"
  },
  { pull: $item`white page`, useful: () => !have($skill`Piezoelectric Honk`) },
  { pull: $item`portable cassette player` },
  { pull: $item`antique machete` },
  { pull: $item`book of matches` },
  { pull: $items`Space Trip safety headphones, HOA regulation book`, name: "-ML", optional: true },
  { pull: $item`yule hatchet` },
  { pull: $item`grey down vest` },
  { pull: $item`teacher's pen`, duplicate: true },
  { pull: $item`blackberry galoshes`, useful: () => step("questL11Black") < 2 },
  { pull: $item`killing jar`, useful: () => !have($familiar`Melodramedary`) },
  { pull: $item`old patched suit-pants`, optional: true },
  { pull: $item`transparent pants`, optional: true, useful: () => !have($item`designer sweatpants`) },
  { pull: $item`deck of lewd playing cards`, optional: true },
  { pull: $item`mafia thumb ring`, optional: true },
  { pull: $item`giant yellow hat` },
  { pull: $item`gravy boat` },
  {
    pull: $item`Mohawk wig`,
    useful: () => (have($item`S.O.C.K.`) ? !have($item`Mohawk wig`) : undefined), // if one didn't drop naturally
  },
  { pull: $item`11-leaf clover`, duplicate: true },
  {
    pull: $item`wet stew`,
    useful: () =>
      step("questL11Palindome") < 5 &&
      !have($item`wet stunt nut stew`) &&
      !have($item`wet stew`) &&
      (!have($item`lion oil`) || !have($item`bird rib`)),
  },
  {
    pull: $item`ninja rope`,
    useful: () =>
      step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
  {
    pull: $item`ninja carabiner`,
    useful: () =>
      step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
  {
    pull: $item`ninja crampons`,
    useful: () =>
      step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
];

class Pull {
  items: () => (Item | undefined)[];
  name: string;
  optional: boolean;
  duplicate: boolean;
  useful: () => boolean | undefined;
  post: () => void;
  description?: string;

  constructor(spec: PullSpec) {
    if ("name" in spec) {
      this.name = spec.name;
      this.description = spec.name;
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
    this.duplicate = spec.duplicate ?? false;
    this.optional = spec.optional ?? false;
    this.useful = spec.useful ?? (() => true);
    this.post = spec.post ?? (() => { null; });
  }

  public wasPulled(pulled: Set<Item>) {
    for (const item of this.items()) {
      if (item === undefined) continue;
      if (!this.duplicate && have(item)) return true;
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

    let count = pullsRemaining() - (20 - args.pulls);
    if (inHardcore() || myTurncount() >= 1000) count = 0; // No pulls in hardcore or out of ronin

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
          count--;
          continue;
      }
    }
  }

  public pullsUsed(): number {
    return get("_roninStoragePulls").split(",").length;
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
          pull.post();
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
