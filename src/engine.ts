import { familiarWeight, Location, Monster } from "kolmafia";
import { Task } from "./tasks/structure";
import { $effect, $familiar, $item, $skill, get, have, Macro, PropertiesManager } from "libram";
import {
  BuiltCombatStrategy,
  CombatResourceAllocation,
  CombatStrategy,
  MonsterStrategy,
} from "./combat";
import { Outfit } from "./outfit";
import { applyEffects, moodCompatible } from "./moods";
import {
  adv1,
  buy,
  choiceFollowsFight,
  cliExecute,
  equippedAmount,
  inMultiFight,
  itemAmount,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
} from "kolmafia";
import { debug } from "./lib";
import {
  canChargeVoid,
  freekillSources,
  runawaySources,
  unusedBanishes,
  WandererSource,
  wandererSources,
} from "./resources";
import { absorbtionTargets } from "./tasks/absorb";

export class Engine {
  attempts: { [task_name: string]: number } = {};
  propertyManager = new PropertiesManager();
  tasks: Task[];
  tasks_by_name = new Map<string, Task>();

  constructor(tasks: Task[]) {
    this.tasks = tasks;
    for (const task of tasks) {
      this.tasks_by_name.set(task.name, task);
    }
  }

  public available(task: Task, orb_predictions?: Map<Location, Monster>): boolean {
    for (const after of task.after) {
      const after_task = this.tasks_by_name.get(after);
      if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
      if (!after_task.completed()) return false;
    }
    if (task.ready && !task.ready()) return false;

    // Ensure the Grey Goose is charged if we plan on absorbing
    if (
      task.do instanceof Location &&
      absorbtionTargets.hasReprocessTargets(task.do) &&
      // eslint-disable-next-line libram/verify-constants
      familiarWeight($familiar`Grey Goose`) < 6
    )
      return false;

    // Ensure that the current +/- combat effects are compatible
    const outfit_spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
    if (!moodCompatible(outfit_spec?.modifier)) return false;

    // Dodge useless monsters with the orb
    if (task.do instanceof Location && orb_predictions !== undefined) {
      const next_monster = orb_predictions.get(task.do);
      if (next_monster !== undefined) {
        const task_combat = task.combat ?? new CombatStrategy();
        const next_monster_strategy = task_combat.currentStrategy(next_monster);
        if (
          (next_monster_strategy === MonsterStrategy.Ignore ||
            next_monster_strategy === MonsterStrategy.IgnoreNoBanish ||
            next_monster_strategy === MonsterStrategy.Banish) &&
          !absorbtionTargets.isTarget(next_monster)
        ) {
          // So the next monster is useless. Dodge it if there is also a useful monster
          if (absorbtionTargets.hasTargets(task.do)) return false;
          if (task_combat.can(MonsterStrategy.Kill)) return false;
          if (task_combat.can(MonsterStrategy.KillFree)) return false;
          if (task_combat.can(MonsterStrategy.KillHard)) return false;
          if (task_combat.can(MonsterStrategy.KillItem)) return false;
        }
      }
    }
    return !task.completed();
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public execute(task: Task, ...wanderers: WandererSource[]): void {
    debug(``);
    debug(`Executing ${task.name}`, "blue");
    this.check_limits(task);

    // Get needed items
    for (const to_get of task.acquire || []) {
      const num_needed = to_get.num ?? 1;
      const num_have = itemAmount(to_get.item) + equippedAmount(to_get.item);
      if (num_needed <= num_have) continue;
      if (to_get.useful !== undefined && !to_get.useful()) continue;
      if (to_get.item === $item`makeshift garbage shirt`) {
        // Hardcode to avoid mafia weirdness
        cliExecute("fold makeshift garbage shirt");
      } else if (to_get.price !== undefined) {
        debug(`Purchasing ${num_needed - num_have} ${to_get.item} below ${to_get.price}`);
        buy(to_get.item, num_needed - num_have, to_get.price);
      } else {
        debug(`Acquiring ${num_needed} ${to_get.item}`);
        retrieveItem(to_get.item, num_needed);
      }
      if (
        itemAmount(to_get.item) + equippedAmount(to_get.item) < num_needed &&
        (to_get.optional ?? true)
      ) {
        throw `Task ${task.name} was unable to acquire ${num_needed} ${to_get.item}`;
      }
    }

    // Prepare choice selections
    const choices: { [choice: number]: number } = {};
    for (const choice_id_str in task.choices) {
      const choice_id = parseInt(choice_id_str);
      const choice = task.choices[choice_id];
      if (typeof choice === "number") choices[choice_id] = choice;
      else choices[choice_id] = choice();
    }
    this.propertyManager.setChoices(choices);
    const ignored_noncombats = [
      "Wooof! Wooooooof!",
      "Seeing-Eyes Dog",
      "Playing Fetch",
      "Lights Out in the",
    ];
    const ignored_noncombats_seen = ignored_noncombats.filter(
      (name) => task.do instanceof Location && task.do.noncombatQueue.includes(name)
    );

    // Prepare basic equipment
    const outfit = Outfit.create(task);
    for (const wanderer of wanderers) {
      if (!outfit.equip(wanderer?.equip))
        throw `Wanderer equipment ${wanderer.equip} conflicts with ${task.name}`;
    }

    if (!task.freeaction) {
      // Prepare combat macro
      const task_combat = task.combat?.clone() ?? new CombatStrategy();

      // Absorb targeted monsters
      const absorb_targets =
        task.do instanceof Location ? absorbtionTargets.remaining(task.do) : [];
      for (const monster of absorb_targets) {
        if (absorbtionTargets.isReprocessTarget(monster)) {
          // eslint-disable-next-line libram/verify-constants
          if (familiarWeight($familiar`Grey Goose`) >= 6 && outfit.equip($familiar`Grey Goose`)) {
            // eslint-disable-next-line libram/verify-constants
            task_combat.prependMacro(new Macro().trySkill($skill`Re-Process Matter`), monster);
            debug(`Target x2: ${monster.name}`, "purple");
          } else {
            debug(`Target x2 (no reprocess): ${monster.name}`, "pruple");
          }
        } else {
          debug(`Target: ${monster.name}`, "purple");
        }
        const strategy = task_combat.currentStrategy(monster);
        if (
          strategy === MonsterStrategy.Ignore ||
          strategy === MonsterStrategy.Banish ||
          strategy === MonsterStrategy.IgnoreNoBanish
        ) {
          task_combat.kill(monster); // TODO: KillBanish for Banish, KillNoBanish for IgnoreNoBanish
        }
      }

      // Use rock-band flyers if needed
      if (
        have($item`rock band flyers`) &&
        get("flyeredML") < 10000 &&
        task_combat.default_macro === undefined // TODO: append to existing macro
      ) {
        task_combat.prependMacro(new Macro().tryItem($item`rock band flyers`));
      }

      // Apply resources
      const combat_resources = new CombatResourceAllocation();
      if (wanderers.length === 0) {
        // Set up a banish if needed
        const banishSources = unusedBanishes(task_combat.where(MonsterStrategy.Banish));
        combat_resources.banishWith(outfit.equipFirst(banishSources));

        // Set up a runaway if there are combats we do not care about
        let runaway = undefined;
        if (task_combat.can(MonsterStrategy.Ignore)) {
          runaway = outfit.equipFirst(runawaySources);
          combat_resources.runawayWith(runaway);
        }
        if (task_combat.can(MonsterStrategy.IgnoreNoBanish)) {
          if (runaway !== undefined && !runaway.banishes)
            combat_resources.runawayNoBanishWith(runaway);
          else
            combat_resources.runawayNoBanishWith(
              outfit.equipFirst(runawaySources.filter((source) => !source.banishes))
            );
        }

        // Set up a free kill if needed, or if no free kills will ever be needed again
        if (
          task_combat.can(MonsterStrategy.KillFree) ||
          (task_combat.can(MonsterStrategy.Kill) &&
            !task_combat.boss &&
            this.tasks.every((t) => t.completed() || !t.combat?.can(MonsterStrategy.KillFree)))
        ) {
          combat_resources.freekillWith(outfit.equipFirst(freekillSources));
        }
      }

      // Charge familiars if needed
      outfit.equipCharging();

      // Set up more wanderers if delay is needed
      if (wanderers.length === 0 && this.hasDelay(task))
        wanderers = outfit.equipUntilCapped(wandererSources);

      // Prepare mood
      applyEffects(outfit.modifier ?? "", task.effects || []);

      // Prepare full outfit
      if (task_combat.boss) outfit.equip($familiar`Machine Elf`);
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      if (!task_combat.boss && !freecombat) outfit.equip($item`carnivorous potted plant`);
      if (
        canChargeVoid() &&
        !freecombat &&
        ((task_combat.can(MonsterStrategy.Kill) &&
          !combat_resources.has(MonsterStrategy.KillFree)) ||
          task_combat.can(MonsterStrategy.KillHard) ||
          task_combat.boss)
      )
        outfit.equip($item`cursed magnifying glass`);
      outfit.equipDefaults();
      outfit.dress();

      // Prepare resources if needed
      wanderers.map((source) => source.prepare && source.prepare());
      combat_resources.all().map((source) => source.prepare && source.prepare());

      // HP/MP upkeep
      // if (myHp() < myMaxhp() / 2) useSkill($skill`Cannelloni Cocoon`);
      // if (!have($effect`Super Skill`)) restoreMp(myMaxmp() < 200 ? myMaxmp() : 200);

      // Prepare combat macro (after effects and outfit)
      const combat = new BuiltCombatStrategy(task_combat, combat_resources, wanderers);
      debug(combat.macro.toString(), "blue");
      setAutoAttack(0);
      combat.macro.save();
    } else {
      // Prepare only as requested by the task
      applyEffects(outfit.modifier ?? "", task.effects || []);
      outfit.dress();
    }

    // Do any task-specific preparation
    if (task.prepare) task.prepare();

    // Do the task
    if (typeof task.do === "function") {
      task.do();
    } else {
      adv1(task.do, 0, "");
    }
    runCombat();
    while (inMultiFight()) runCombat();
    if (choiceFollowsFight()) runChoice(-1);
    if (task.post) task.post();

    absorbtionTargets.updateAbsorbed();

    if (have($effect`Beaten Up`)) throw "Fight was lost; stop.";

    // Mark the number of attempts (unless an ignored noncombat occured)
    if (!(task.name in this.attempts)) this.attempts[task.name] = 0;
    if (
      ignored_noncombats.filter(
        (name) => task.do instanceof Location && task.do.noncombatQueue.includes(name)
      ).length === ignored_noncombats_seen.length
    ) {
      this.attempts[task.name]++;
    }

    if (task.completed()) {
      debug(`${task.name} completed!`, "blue");
    } else {
      debug(`${task.name} not completed!`, "blue");
      this.check_limits(task); // Error if too many tries occur
    }
  }

  public check_limits(task: Task): void {
    const failureMessage = task.limit.message ? ` ${task.limit.message}` : "";
    if (task.limit.tries && this.attempts[task.name] >= task.limit.tries)
      throw `Task ${task.name} did not complete within ${task.limit.tries} attempts. Please check what went wrong.${failureMessage}`;
    if (task.limit.soft && this.attempts[task.name] >= task.limit.soft)
      throw `Task ${task.name} did not complete within ${task.limit.soft} attempts. Please check what went wrong (you may just be unlucky).${failureMessage}`;
    if (task.limit.turns && task.do instanceof Location && task.do.turnsSpent >= task.limit.turns)
      throw `Task ${task.name} did not complete within ${task.limit.turns} turns. Please check what went wrong.${failureMessage}`;
  }
}
