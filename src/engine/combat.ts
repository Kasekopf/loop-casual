import {
  appearanceRates,
  equippedAmount,
  equippedItem,
  floor,
  Item,
  Location,
  Monster,
  monsterDefense,
  myBuffedstat,
  myMp,
  numericModifier,
  Skill,
  weaponType,
} from "kolmafia";
import {
  $item,
  $monster,
  $skill,
  $slot,
  $stat,
  getTodaysHolidayWanderers,
  have,
  Macro,
} from "libram";
import {
  BanishSource,
  CombatResource,
  FreekillSource,
  RunawaySource,
  WandererSource,
} from "./resources";

export enum MonsterStrategy {
  Ignore, // Task doesn't care what happens
  IgnoreNoBanish, // Task doesn't care what happens, as long as it is not banished
  Kill, // Task needs to kill it, with or without a free kill
  KillFree, // Task needs to kill it with a free kill
  KillHard, // Task needs to kill it without using a free kill (i.e., boss, or already free)
  Banish, // Task doesn't care what happens, but banishing is useful
  Abort, // Abort the macro and the script; an error has occured
  KillItem, // Kill with an item boost
}

export class CombatResourceAllocation {
  private base = new Map<MonsterStrategy, CombatResource>();

  allocate(strategy: MonsterStrategy, resource?: CombatResource) {
    if (resource === undefined) return;
    this.base.set(strategy, resource);
  }

  // Typed allocation methods for safety
  public banishWith(resource?: BanishSource): void {
    this.allocate(MonsterStrategy.Banish, resource);
  }
  public freekillWith(resource?: FreekillSource): void {
    this.allocate(MonsterStrategy.KillFree, resource);
  }
  public runawayWith(resource?: RunawaySource): void {
    this.allocate(MonsterStrategy.Ignore, resource);
  }
  public runawayNoBanishWith(resource?: RunawaySource): void {
    this.allocate(MonsterStrategy.IgnoreNoBanish, resource);
  }

  public all(): CombatResource[] {
    return Array.from(this.base.values());
  }

  public has(for_strategy: MonsterStrategy) {
    return this.base.has(for_strategy);
  }

  public getMacro(for_strategy: MonsterStrategy): Macro | undefined {
    const resource = this.base.get(for_strategy);
    if (resource === undefined) return undefined;
    if (resource.do instanceof Macro) return resource.do;
    if (resource.do instanceof Item) return new Macro().item(resource.do);
    if (resource.do instanceof Skill) return new Macro().skill(resource.do);
    throw `Unable to convert resource ${resource.name} to a macro`;
  }
}

export class BuiltCombatStrategy {
  macro: Macro = new Macro();
  autoattack: Macro = new Macro();
  boss: boolean;
  resources: CombatResourceAllocation;

  constructor(
    abstract: CombatStrategy,
    resources: CombatResourceAllocation,
    wanderers: WandererSource[],
    location: Location | undefined
  ) {
    this.boss = abstract.boss;
    this.resources = resources;

    // First, kill wanderers
    const wandererMonsters: [string | Monster, Macro][] = wanderers.map((w) => [w.monster, w.action ?? new Macro()]);
    if (
      equippedAmount($item`Kramco Sausage-o-Matic™`) > 0 &&
      wandererMonsters.find((m) => m[0] === $monster`sausage goblin`) === undefined
    ) {
      // Always be ready to fight sausage goblins if we equip Kramco
      wandererMonsters.push([$monster`sausage goblin`, new Macro().trySkill($skill`Emit Matter Duplicating Drones`)]);
    }
    for (const wanderer of wandererMonsters) {
      // Note that we kill hard, which never uses up a freekill
      this.macro = this.macro.if_(wanderer[0], new Macro().step(wanderer[1]).step(this.prepare_macro(MonsterStrategy.KillHard)));
    }

    // Set up the autoattack
    const autoattack_macros = new CompressedMacro();
    abstract.autoattacks.forEach((value, key) => {
      autoattack_macros.add(key, new Macro().step(...value.map((m) => undelay(m))));
    });
    this.autoattack.step(autoattack_macros.build());
    if (abstract.default_autoattack)
      this.autoattack.step(
        new Macro().step(...abstract.default_autoattack.map((m) => undelay(m)))
      );

    // If there is macro precursor, do it now
    if (abstract.init_macro) {
      this.macro = this.macro.step(undelay(abstract.init_macro));
    }

    // Perform any monster-specific macros (these may or may not end the fight)
    const monster_macros = new CompressedMacro();
    abstract.macros.forEach((value, key) => {
      monster_macros.add(key, new Macro().step(...value.map((m) => undelay(m))));
    });
    this.macro.step(monster_macros.build());

    // Perform the non-monster specific macro
    if (abstract.default_macro)
      this.macro = this.macro.step(
        new Macro().step(...abstract.default_macro.map((m) => undelay(m)))
      );

    // Perform monster-specific strategies
    const monster_strategies = new CompressedMacro();
    abstract.strategy.forEach((strat, monster) => {
      monster_strategies.add(monster, this.prepare_macro(strat, monster));
    });
    this.macro.step(monster_strategies.build());

    // Perform the default strategy
    this.macro = this.macro.step(this.prepare_macro(abstract.default_strategy, location));
  }

  prepare_macro(strategy: MonsterStrategy | Macro, target?: Monster | Location): Macro {
    if (strategy instanceof Macro) return strategy;

    const monster = target instanceof Monster ? target : undefined;

    // Upgrade normal kills to free kills if provided
    if (
      strategy === MonsterStrategy.Kill &&
      this.resources.has(MonsterStrategy.KillFree) &&
      !(monster?.boss || this.boss)
    ) {
      strategy = MonsterStrategy.KillFree;
    }

    // Upgrade normal kills to hard kills if we are underleveled
    if (
      strategy === MonsterStrategy.Kill &&
      this.resources.has(MonsterStrategy.KillFree) === undefined &&
      monster &&
      monsterDefense(monster) * 1.25 > myBuffedstat(weaponType(equippedItem($slot`Weapon`)))
    ) {
      strategy = MonsterStrategy.KillHard;
    }

    // Use the appropriate resource if provided
    const use_resource = this.resources.getMacro(strategy);
    if (use_resource !== undefined) return use_resource;

    // Choose a killing blow (items, banish, or stats)
    let killing_blow = undefined;
    let killing_stat = undefined;
    if (myMp() >= 20) {
      if (strategy === MonsterStrategy.KillItem && have($skill`Double Nanovision`)) {
        killing_stat = $stat`Mysticality`;
        killing_blow = $skill`Double Nanovision`;
      } else if (have($skill`Infinite Loop`)) {
        killing_stat = $stat`Moxie`;
        killing_blow = $skill`Infinite Loop`;
      }
    }

    // Otherwise, default to standard strategies
    switch (strategy) {
      case MonsterStrategy.KillItem:
      case MonsterStrategy.IgnoreNoBanish:
      case MonsterStrategy.Ignore:
      case MonsterStrategy.Kill:
      case MonsterStrategy.KillHard:
      case MonsterStrategy.Banish:
        if ((monster && monster.physicalResistance >= 70) || !killing_blow)
          return new Macro().attack().repeat();
        if (!killing_stat) return new Macro().abort();
        if (myMp() < 20) return new Macro().abort();

        // Weaken monsters with Pseudopod slap until they are in range of our kill.
        // Since monsterhpabove is locked behind manuel/factoids, just do the maximum
        // number of slaps we could ever need for the monster/zone.
        if (myBuffedstat(killing_stat) * floor(myMp() / 20) < 100) {
          const HPgap = maxHP(target) - myBuffedstat(killing_stat) * floor(myMp() / 20);
          const slaps = Math.ceil(HPgap / 10);
          if (slaps > 0) {
            return new Macro()
              .while_(`!times ${slaps}`, new Macro().skill($skill`Pseudopod Slap`))
              .while_("!mpbelow 20", new Macro().skill(killing_blow))
              .attack()
              .repeat();
          }
        }
        return new Macro().while_("!mpbelow 20", new Macro().skill(killing_blow)).attack().repeat();
      // Abort for strategies that can only be done with resources
      case MonsterStrategy.KillFree:
      case MonsterStrategy.Abort:
        return new Macro().abort();
    }
  }
}

function getMonsters(where?: Location): Monster[] {
  if (where === undefined) return [];
  return Object.entries(appearanceRates(where)) // Get the maximum HP in the location
    .filter((i) => i[1] > 0)
    .map((i) => Monster.get(i[0]));
}

function maxHP(target?: Monster | Location): number {
  if (target === undefined) return 1;
  const base =
    target instanceof Location ? Math.max(...getMonsters(target).map(maxHP)) : target.baseHp;
  return Math.floor(1.05 * base) + numericModifier("Monster Level");
}

export type DelayedMacro = Macro | (() => Macro);

function undelay(macro: DelayedMacro): Macro {
  if (macro instanceof Macro) return macro;
  else return macro();
}

const holidayMonsters = getTodaysHolidayWanderers();

export class CombatStrategy {
  init_macro?: DelayedMacro;
  default_strategy: MonsterStrategy = MonsterStrategy.Ignore;
  default_macro?: DelayedMacro[];
  default_autoattack?: DelayedMacro[];
  strategy: Map<Monster, MonsterStrategy> = new Map();
  macros: Map<Monster, DelayedMacro[]> = new Map();
  autoattacks: Map<Monster, DelayedMacro[]> = new Map();
  boss: boolean;

  constructor(boss?: boolean) {
    this.boss = boss ?? false;

    // TODO: better detection of which zones holiday monsters can appear
    if (holidayMonsters.length > 0 && !this.boss) this.ignore(...holidayMonsters);
  }

  apply(strategy: MonsterStrategy, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      this.default_strategy = strategy;
    }
    for (const monster of monsters) {
      this.strategy.set(monster, strategy);
    }
    return this;
  }
  public kill(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Kill, ...monsters);
  }
  public killFree(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.KillFree, ...monsters);
  }
  public killHard(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.KillHard, ...monsters);
  }
  public killItem(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.KillItem, ...monsters);
  }
  public banish(...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) throw `Must specify list of monsters to banish`;
    return this.apply(MonsterStrategy.Banish, ...monsters);
  }
  public ignore(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Ignore, ...monsters);
  }
  public ignoreNoBanish(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.IgnoreNoBanish, ...monsters);
  }
  public abort(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Abort, ...monsters);
  }
  public macro(strategy: DelayedMacro, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      if (this.default_macro === undefined) this.default_macro = [];
      this.default_macro.push(strategy);
    }
    for (const monster of monsters) {
      if (!this.macros.has(monster)) this.macros.set(monster, []);
      this.macros.get(monster)?.push(strategy);
    }
    return this;
  }
  public prependMacro(strategy: DelayedMacro, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      this.init_macro = strategy;
    }
    for (const monster of monsters) {
      if (!this.macros.has(monster)) this.macros.set(monster, []);
      this.macros.get(monster)?.unshift(strategy);
    }
    return this;
  }

  public autoattack(strategy: DelayedMacro, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      if (this.default_autoattack === undefined) this.default_autoattack = [];
      this.default_autoattack.push(strategy);
    }
    for (const monster of monsters) {
      if (!this.autoattacks.has(monster)) this.autoattacks.set(monster, []);
      this.autoattacks.get(monster)?.push(strategy);
    }
    return this;
  }

  public can(do_this: MonsterStrategy): boolean {
    if (do_this === this.default_strategy) return true;
    return Array.from(this.strategy.values()).includes(do_this);
  }

  public where(do_this: MonsterStrategy): Monster[] {
    return Array.from(this.strategy.keys()).filter((key) => this.strategy.get(key) === do_this);
  }

  public currentStrategy(monster: Monster): MonsterStrategy {
    return this.strategy.get(monster) ?? this.default_strategy;
  }

  public clone(): CombatStrategy {
    const result = new CombatStrategy(this.boss);
    result.default_strategy = this.default_strategy;
    if (this.default_macro) result.default_macro = [...this.default_macro];
    if (this.default_autoattack) result.default_macro = [...this.default_autoattack];
    result.strategy = new Map(this.strategy);
    for (const pair of this.macros) result.macros.set(pair[0], [...pair[1]]);
    for (const pair of this.autoattacks) result.autoattacks.set(pair[0], [...pair[1]]);
    return result;
  }
}

export function main(): void {
  Macro.load().submit();
}

class CompressedMacro {
  // Build a macro that combines if statements (keyed on monster) with
  // identical body into a single if statement, to avoid the 37-action limit.
  //  Ex: [if x; A; if y; B; if z; A;] => [if x || z; A; if y; B]
  components = new Map<string, Monster[]>();
  public add(monster: Monster, macro: Macro): void {
    const macro_text = macro.toString();
    if (macro_text.length === 0) return;
    if (!this.components.has(macro_text)) this.components.set(macro_text, [monster]);
    else this.components.get(macro_text)?.push(monster);
  }

  public build(): Macro {
    let result = new Macro();
    this.components.forEach((monsters, macro) => {
      const condition = monsters.map((mon) => `monsterid ${mon.id}`).join(" || ");
      result = result.if_(condition, macro);
    });
    return result;
  }
}
