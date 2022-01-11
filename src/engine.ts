import { Limit, Task } from "./tasks/structure";
import { $effect, $skill, have, PropertiesManager } from "libram";
import { CombatStrategy, MonsterStrategy } from "./combat";
import { Outfit } from "./outfit";
import { applyEffects } from "./moods";
import {
  adv1,
  choiceFollowsFight,
  cliExecute,
  inMultiFight,
  myHp,
  myMaxhp,
  myMaxmp,
  restoreMp,
  runChoice,
  runCombat,
  setAutoAttack,
  useSkill,
} from "kolmafia";
import { debug } from "./lib";
import { WandererSource } from "./resources";

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

  public available_delay(task: Task): boolean {
    if (!this.available(task)) return false;
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public execute(task: Task, wanderer?: WandererSource): void {
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
    for (const item of task.acquire || []) {
      if (item instanceof Item) cliExecute(`acquire ${item.name}`);
      else cliExecute(`acquire ${item[0]} ${item[1].name}`);
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

    if (task.freeaction) {
      // Prepare equipment
      const outfit = Outfit.create_mandatory(task);
      outfit.dress();

      if (task.prepare) task.prepare();

      if (typeof task.do === "function") {
        task.do();
      } else {
        adv1(task.do, 0, "");
      }

      if (task.post) task.post();
    } else {
      // Prepare combat macro
      const combat = (task.combat || new CombatStrategy()).build();
      if (wanderer) combat.handle_monster(wanderer.monster, MonsterStrategy.KillHard);

      // Prepare mood
      applyEffects(task.modifier || "", task.effects || []);

      // Prepare equipment
      const outfit = Outfit.create(task, combat, wanderer);
      outfit.dress();

      // HP/MP upkeep
      if (myHp() < myMaxhp() - 100) useSkill($skill`Cannelloni Cocoon`);
      restoreMp(myMaxmp() < 200 ? myMaxmp() : 200);

      // Do any task-specific preparation
      if (task.prepare) task.prepare();

      // Do the task
      debug(combat.macro.toString(), "blue");
      setAutoAttack(0);
      combat.macro.save();
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
    }

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
