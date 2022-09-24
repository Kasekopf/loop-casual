/**
 * Temporary priorities that override the routing.
 */

import { familiarWeight, getCounter, Location, Monster } from "kolmafia";
import { $effect, $familiar, $item, $skill, get, getTodaysHolidayWanderers, have } from "libram";
import { CombatStrategy } from "./combat";
import { moodCompatible } from "./moods";
import { Task } from "./task";
import { globalStateCache } from "./state";
import { forceItemSources, yellowRaySources } from "./resources";

export enum OverridePriority {
  Wanderer = 20000,
  Always = 10000,
  Free = 1000,
  Start = 900,
  LastCopyableMonster = 100,
  Effect = 20,
  GoodOrb = 15,
  GoodYR = 10,
  MinorEffect = 2,
  GoodGoose = 1,
  GoodBanish = 0.5,
  None = 0,
  BadOrb = -4,
  BadHoliday = -10,
  BadYR = -16,
  BadGoose = -30,
  BadMood = -100,
  Last = -10000,
}

export class Prioritization {
  private priorities = new Set<OverridePriority>();
  private orb_monster?: Monster = undefined;

  static fixed(priority: OverridePriority) {
    const result = new Prioritization();
    result.priorities.add(priority);
    return result;
  }

  static from(task: Task): Prioritization {
    const result = new Prioritization();
    const base = task.priority?.() ?? OverridePriority.None;
    if (base !== OverridePriority.None) result.priorities.add(base);

    // Prioritize getting a YR
    const yr_needed =
      task.combat?.can("yellowRay") ||
      (task.combat?.can("forceItems") && !forceItemSources.find((s) => s.available()));
    if (yr_needed && yellowRaySources.find((yr) => yr.available())) {
      if (have($effect`Everything Looks Yellow`)) result.priorities.add(OverridePriority.BadYR);
      else result.priorities.add(OverridePriority.GoodYR);
    }

    // Check if Grey Goose is charged
    if (needsChargedGoose(task)) {
      if (familiarWeight($familiar`Grey Goose`) < 6) {
        // Do not trigger BadGoose if a YR is up, to make the airship flow better.
        // This way we can get the YR off and use the goose separately
        if (!result.priorities.has(OverridePriority.GoodYR)) {
          result.priorities.add(OverridePriority.BadGoose);
        }
      } else {
        result.priorities.add(OverridePriority.GoodGoose);
      }
    }

    // Dodge useless monsters with the orb
    if (task.do instanceof Location) {
      const next_monster = globalStateCache.orb().prediction(task.do);
      if (next_monster !== undefined) {
        result.orb_monster = next_monster;
        result.priorities.add(orbPriority(task, next_monster));
      }
    }

    // Ensure that the current +/- combat effects are compatible
    //  (Macguffin/Forest is tough and doesn't need much +combat; just power though)
    const outfit_spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
    if (!moodCompatible(outfit_spec?.modifier) && task.name !== "Macguffin/Forest") {
      result.priorities.add(OverridePriority.BadMood);
    }

    // Burn off desert debuffs
    if (
      (have($effect`Prestidigysfunction`) || have($effect`Turned Into a Skeleton`)) &&
      task.combat &&
      task.combat.can("killItem")
    ) {
      result.priorities.add(OverridePriority.BadMood);
    }

    // Wait until we get a -combat skill before doing any -combat
    if (
      outfit_spec?.modifier &&
      outfit_spec.modifier.includes("-combat") &&
      !have($skill`Phase Shift`) &&
      !(
        // All these add up to -25 combat fine, no need to wait
        (
          have($item`Space Trip safety headphones`) &&
          have($item`unbreakable umbrella`) &&
          have($item`protonic accelerator pack`) &&
          (!get("_olympicSwimmingPool") || have($effect`Silent Running`))
        )
      )
    ) {
      result.priorities.add(OverridePriority.BadMood);
    }

    // If we have already used banishes in the zone, prefer it
    if (globalStateCache.banishes().isPartiallyBanished(task)) {
      result.priorities.add(OverridePriority.GoodBanish);
    }

    // Avoid ML boosting zones when a scaling holiday wanderer is due
    if (outfit_spec?.modifier?.includes("ML") && !outfit_spec?.modifier.match("-[\\d .]*ML")) {
      if (getTodaysHolidayWanderers().length > 0 && getCounter("holiday") <= 0) {
        result.priorities.add(OverridePriority.BadHoliday);
      }
    }

    return result;
  }

  public explain(): string {
    const reasons = new Map<OverridePriority, string>([
      [OverridePriority.Wanderer, "Wanderer"],
      [OverridePriority.Always, "Forced"],
      [OverridePriority.Free, "Free action"],
      [OverridePriority.Start, "Initial tasks"],
      [OverridePriority.LastCopyableMonster, "Copy last monster"],
      [OverridePriority.Effect, "Useful effect"],
      [OverridePriority.GoodOrb, this.orb_monster ? `Target ${this.orb_monster}` : `Target ?`],
      [OverridePriority.GoodYR, "Yellow ray"],
      [OverridePriority.MinorEffect, "Useful minor effect"],
      [OverridePriority.GoodGoose, "Goose charged"],
      [OverridePriority.GoodBanish, "Banishes committed"],
      [OverridePriority.BadYR, "Too early for yellow ray"],
      [OverridePriority.BadOrb, this.orb_monster ? `Avoid ${this.orb_monster}` : `Avoid ?`],
      [OverridePriority.BadGoose, "Goose not charged"],
      [OverridePriority.BadMood, "Wrong combat modifiers"],
    ]);
    return [...this.priorities]
      .map((priority) => reasons.get(priority))
      .filter((priority) => priority !== undefined)
      .join(", ");
  }

  public has(priorty: OverridePriority) {
    return this.priorities.has(priorty);
  }

  public score(): number {
    let result = 0;
    for (const priority of this.priorities) {
      result += priority;
    }
    return result;
  }
}

function orbPriority(task: Task, monster: Monster): OverridePriority {
  if (!(task.do instanceof Location)) return OverridePriority.None;

  // If the goose is not charged, do not aim to reprocess
  const absorb_state = globalStateCache.absorb();
  if (absorb_state.isReprocessTarget(monster) && familiarWeight($familiar`Grey Goose`) < 6)
    return OverridePriority.None;

  // Determine if a monster is useful or not based on the combat goals
  if (task.orbtargets === undefined) {
    const task_combat = task.combat ?? new CombatStrategy();
    const next_monster_strategy = task_combat.currentStrategy(monster);

    const next_useless =
      (next_monster_strategy === "ignore" ||
        next_monster_strategy === "ignoreNoBanish" ||
        next_monster_strategy === "ignoreSoftBanish" ||
        next_monster_strategy === "banish") &&
      !absorb_state.isTarget(monster) &&
      (!absorb_state.isReprocessTarget(monster) || familiarWeight($familiar`Grey Goose`) < 6);

    const others_useless =
      task_combat.can("ignore") ||
      task_combat.can("ignoreNoBanish") ||
      task_combat.can("banish") ||
      task_combat.can("ignoreSoftBanish");

    const others_useful =
      absorb_state.hasTargets(task.do) ||
      absorb_state.hasReprocessTargets(task.do) ||
      task_combat.can("kill") ||
      task_combat.can("killFree") ||
      task_combat.can("killHard") ||
      task_combat.can("killItem");

    if (next_useless && others_useful) {
      return OverridePriority.BadOrb;
    } else if (!next_useless && others_useless) {
      return OverridePriority.GoodOrb;
    } else {
      return OverridePriority.None;
    }
  }

  // Use orbtargets to decide if the next monster is useful
  const fromTask = task.orbtargets();
  if (fromTask === undefined) return OverridePriority.None;
  const targets = [
    ...fromTask,
    ...absorb_state.remainingAbsorbs(task.do),
    ...absorb_state.remainingReprocess(task.do),
  ];
  if (targets.length === 0) return OverridePriority.None;
  if (targets.find((t) => t === monster) === undefined) {
    return OverridePriority.BadOrb;
  } else {
    return OverridePriority.GoodOrb;
  }
}

function needsChargedGoose(task: Task): boolean {
  // Note that we purposefully do not check if we will be equipping the goose
  // in the location. We want to eventually reprocess everything, and so a
  // charged goose allows us to use the orb to target reprocess monsters.
  return task.do instanceof Location && globalStateCache.absorb().hasReprocessTargets(task.do);
}
