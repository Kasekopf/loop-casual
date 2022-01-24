import { Limit, Task } from "./tasks/structure";
import { $effect, $familiar, $item, $skill, have, PropertiesManager } from "libram";
import { BuiltCombatStrategy, CombatStrategy, MonsterStrategy } from "./combat";
import { Outfit } from "./outfit";
import { applyEffects } from "./moods";
import {
  adv1,
  buy,
  choiceFollowsFight,
  equippedAmount,
  inMultiFight,
  itemAmount,
  myHp,
  myMaxhp,
  myMaxmp,
  restoreMp,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
  useSkill,
} from "kolmafia";
import { debug } from "./lib";
import {
  canChargeVoid,
  runawaySources,
  unusedBanishes,
  WandererSource,
  wandererSources,
} from "./resources";

export class Engine {
  attempts: { [task_name: string]: number } = {};
  propertyManager = new PropertiesManager();
  tasks_by_name = new Map<string, Task>();

  constructor(tasks: Task[]) {
    for (const task of tasks) {
      this.tasks_by_name.set(task.name, task);
    }
  }

  public available(task: Task): boolean {
    for (const after of task.after) {
      const after_task = this.tasks_by_name.get(after);
      if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
      if (!after_task.completed()) return false;
    }
    if (task.ready && !task.ready()) return false;
    return !task.completed();
  }

  public has_delay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public execute(task: Task, ...wanderers: WandererSource[]): void {
    debug(``);
    debug(`Executing ${task.name}`, "blue");

    if (!(task.name in this.attempts)) {
      this.attempts[task.name] = 0;
    } else if (task.cap && typeof task.cap === "number" && this.attempts[task.name] >= task.cap) {
      throw `Task ${task.name} did not complete within ${task.cap} attempts. Please check what went wrong.`;
    } else if (
      task.cap &&
      task.cap instanceof Limit &&
      task.do instanceof Location &&
      task.do.turnsSpent >= task.cap.turns_spent
    ) {
      throw `Task ${task.name} did not complete within ${task.cap.turns_spent} attempts. Please check what went wrong.`;
    }
    this.attempts[task.name]++;

    // Get needed items
    for (const to_get of task.acquire || []) {
      const num_needed = to_get.num ?? 1;
      const num_have = itemAmount(to_get.item) + equippedAmount(to_get.item);
      if (num_needed <= num_have) continue;
      if (to_get.needed !== undefined && !to_get.needed()) continue;
      if (to_get.price !== undefined) {
        debug(`Purchasing ${num_needed - num_have} ${to_get.item} below ${to_get.price}`);
        buy(to_get.item, num_needed - num_have, to_get.price);
      } else {
        debug(`Acquiring ${num_needed} ${to_get.item}`);
        retrieveItem(to_get.item, num_needed);
      }
      if (itemAmount(to_get.item) + equippedAmount(to_get.item) < num_needed) {
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
    const seen_halloweener =
      task.do instanceof Location && task.do.noncombatQueue.includes("Wooof! Wooooooof!");

    // Prepare basic equipment
    const outfit = Outfit.create(task);
    for (const wanderer of wanderers) {
      if (!outfit.equip(wanderer?.equip)) throw `Wanderer equipment conflicts with ${task.name}`;
    }

    if (!task.freeaction) {
      // Prepare combat macro
      const task_combat = task.combat
        ? task.combat instanceof CombatStrategy
          ? task.combat
          : task.combat()
        : new CombatStrategy();

      let banish = undefined;
      let runaway = undefined;
      if (wanderers.length === 0) {
        // Set up a banish if needed
        const banishers = unusedBanishes(task_combat.where(MonsterStrategy.Banish));
        banish = outfit.equip_first(banishers);

        // Set up a runaway if needed
        if (task_combat.can(MonsterStrategy.RunAway)) runaway = outfit.equip_first(runawaySources);
      }

      // Set up more wanderers if delay is needed
      if (wanderers.length === 0 && this.has_delay(task))
        wanderers = outfit.equip_until_capped(wandererSources);

      // Prepare mood
      applyEffects(task.modifier || "", task.effects || []);

      // Prepare full outfit
      if (task_combat.boss) outfit.equip($familiar`Machine Elf`);
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      if (!task_combat.boss && !freecombat) outfit.equip($item`carnivorous potted plant`);
      if (
        canChargeVoid() &&
        !freecombat &&
        (runaway === undefined ||
          runaway.chance() < 1 ||
          task_combat.can(MonsterStrategy.Kill) ||
          task_combat.can(MonsterStrategy.KillHard))
      )
        outfit.equip($item`cursed magnifying glass`);
      outfit.equip_defaults();
      outfit.dress();

      // Prepare combat macro (after effects and outfit)
      const combat = new BuiltCombatStrategy(task_combat, wanderers, banish, runaway);
      debug(combat.macro.toString(), "blue");
      setAutoAttack(0);
      combat.macro.save();

      // Prepare resources if needed
      wanderers.map((source) => source.prepare && source.prepare());
      if (banish?.prepare !== undefined) banish?.prepare();
      if (runaway?.prepare !== undefined) runaway?.prepare();

      // HP/MP upkeep
      if (myHp() < myMaxhp() / 2) useSkill($skill`Cannelloni Cocoon`);
      if (!have($effect`Super Skill`)) restoreMp(myMaxmp() < 200 ? myMaxmp() : 200);
    } else {
      // Prepare only as requested by the task
      applyEffects(task.modifier || "", task.effects || []);
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

    if (have($effect`Beaten Up`)) throw "Fight was lost; stop.";

    if (
      !seen_halloweener &&
      task.do instanceof Location &&
      (task.do.noncombatQueue.includes("Wooof! Wooooooof!") ||
        task.do.noncombatQueue.includes("Seeing-Eyes Dog")) // TODO: Add more?
    ) {
      // If the Halloweener dog triggered, do not count this as a task attempt
      this.attempts[task.name] -= 1;
    }

    if (task.completed()) debug(`${task.name} completed!`, "blue");
    else debug(`${task.name} not completed!`, "blue");
  }
}
