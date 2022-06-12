import {
  equippedItem,
  Item,
  Monster,
  monsterDefense,
  monsterLevelAdjustment,
  myBuffedstat,
  Skill,
  weaponType,
} from "kolmafia";
import { $item, $skill, $slot, $stat, Macro } from "libram";
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
  boss: boolean;
  resources: CombatResourceAllocation;

  constructor(
    abstract: CombatStrategy,
    resources: CombatResourceAllocation,
    wanderers: WandererSource[]
  ) {
    this.boss = abstract.boss;
    this.resources = resources;

    // First, kill wanderers
    for (const wanderer of wanderers) {
      // Note that we kill hard, which never uses up a freekill
      this.macro = this.macro.if_(
        wanderer.monster,
        new Macro()
          .step(wanderer.macro ?? new Macro())
          .step(this.prepare_macro(MonsterStrategy.KillHard))
      );
    }

    // Second, perform any monster-specific strategies (these may or may not end the fight)
    abstract.macros.forEach((value, key) => {
      this.macro = this.macro.if_(key, undelay(value));
    });
    abstract.strategy.forEach((strat, monster) => {
      this.macro = this.macro.if_(monster, this.prepare_macro(strat, monster));
    });

    // Finally, perform the non-monster specific strategies
    if (abstract.default_macro) this.macro = this.macro.step(undelay(abstract.default_macro));
    this.macro = this.macro.step(this.prepare_macro(abstract.default_strategy));
  }

  prepare_macro(strategy: MonsterStrategy | Macro, monster?: Monster): Macro {
    if (strategy instanceof Macro) return strategy;

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

    // Otherwise, default to standard strategies
    const delevel = new Macro()
      .skill($skill`Curse of Weaksauce`)
      .trySkill($skill`Pocket Crumbs`)
      .trySkill($skill`Micrometeorite`)
      .tryItem($item`Rain-Doh indigo cup`)
      .trySkill($skill`Summon Love Mosquito`)
      .tryItem($item`Time-Spinner`);

    switch (strategy) {
      case MonsterStrategy.IgnoreNoBanish:
      case MonsterStrategy.Ignore:
        // For a casual run, ignoring always means running away
        return new Macro()
          .runaway()
          .skill($skill`Saucestorm`)
          .attack()
          .repeat();
      case MonsterStrategy.Kill:
        if (monsterLevelAdjustment() > 150) return new Macro().skill($skill`Saucegeyser`).repeat();
        if (monster && monster.physicalResistance >= 70)
          return delevel.skill($skill`Saucegeyser`).repeat();
        else return delevel.attack().repeat();
      case MonsterStrategy.KillHard:
        if (
          (monster && monster.physicalResistance >= 70) ||
          weaponType(equippedItem($slot`Weapon`)) !== $stat`muscle`
        ) {
          return delevel.skill($skill`Saucegeyser`).repeat();
        } else {
          return delevel.skill($skill`Lunging Thrust-Smack`).repeat();
        }
      // Abort for strategies that can only be done with resources
      case MonsterStrategy.KillFree:
      case MonsterStrategy.Banish:
      case MonsterStrategy.Abort:
        return new Macro().abort();
    }
  }
}

export type DelayedMacro = Macro | (() => Macro);

function undelay(macro: DelayedMacro): Macro {
  if (macro instanceof Macro) return macro;
  else return macro();
}

export class CombatStrategy {
  default_strategy: MonsterStrategy = MonsterStrategy.Ignore;
  default_macro?: DelayedMacro;
  strategy: Map<Monster, MonsterStrategy> = new Map();
  macros: Map<Monster, DelayedMacro> = new Map();
  boss: boolean;

  constructor(boss?: boolean) {
    this.boss = boss ?? false;
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
      this.default_macro = strategy;
    }
    for (const monster of monsters) {
      this.macros.set(monster, strategy);
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
}

export function main(): void {
  Macro.load().submit();
}
