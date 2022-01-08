import { Limit, Task } from "./tasks/structure";
import { $skill, PropertiesManager } from "libram";
import { CombatStrategy } from "./combat";
import { Outfit } from "./outfit";
import { applyEffects } from "./moods";
import {
  adv1,
  choiceFollowsFight,
  inMultiFight,
  myHp,
  myMaxhp,
  myMaxmp,
  restoreMp,
  runCombat,
  setAutoAttack,
  useSkill,
  visitUrl,
} from "kolmafia";
import { debug } from "./lib";

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

  public execute(task: Task): void {
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

    // Prepare combat macro
    const combat = (task.combat || new CombatStrategy()).build();

    // Prepare mood
    if (task.modifier) applyEffects(task.modifier);

    // Prepare equipment
    const outfit = Outfit.create(task, combat);
    outfit.dress();

    // HP/MP upkeep
    if (myHp() < myMaxhp() - 100) useSkill($skill`Cannelloni Cocoon`);
    restoreMp(myMaxmp() < 100 ? myMaxmp() : 100);

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
    while (inMultiFight()) runCombat();
    if (choiceFollowsFight()) visitUrl("choice.php");

    // If the Halloweener dog triggered, do not count this as a task attempt
    if (
      !seen_halloweener &&
      task.do instanceof Location &&
      task.do.noncombatQueue.includes("Wooof! Wooooooof!")
    ) {
      this.attempts[task.name] -= 1;
    }
  }
}
