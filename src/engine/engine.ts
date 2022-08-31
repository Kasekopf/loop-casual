import { Location, Monster, myAdventures } from "kolmafia";
import { Task } from "./task";
import { $effect, $familiar, $item, $skill, have, PropertiesManager } from "libram";
import { CombatActions, MyActionDefaults } from "./combat";
import { Engine as BaseEngine, CombatResources, CombatStrategy, Outfit } from "grimoire-kolmafia";
import { applyEffects } from "./moods";
import { myHp, myMaxhp, myMaxmp, restoreMp, useSkill } from "kolmafia";
import { debug } from "../lib";
import {
  canChargeVoid,
  freekillSources,
  runawaySources,
  unusedBanishes,
  WandererSource,
  wandererSources,
} from "./resources";
import { createOutfit, equipDefaults, equipFirst, equipInitial, equipUntilCapped } from "./outfit";

type ActiveTask = Task & {
  wanderer?: WandererSource;
};

export class Engine extends BaseEngine<CombatActions, ActiveTask> {
  constructor(tasks: Task[]) {
    super(tasks, { combat_defaults: new MyActionDefaults() });
  }

  public available(task: Task): boolean {
    if (myAdventures() === 0 && !task.noadventures) return false;
    return super.available(task);
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public getNextTask(): ActiveTask | undefined {
    // First, check for any prioritized tasks
    const priority = this.tasks.find(
      (task) => this.available(task) && task.priority !== undefined && task.priority()
    );
    if (priority !== undefined) {
      return priority;
    }

    // If a wanderer is up try to place it in a useful location
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    const delay_burning = this.tasks.find(
      (task) =>
        this.hasDelay(task) &&
        this.available(task) &&
        createOutfit(task).canEquip(wanderer?.equip ?? [])
    );
    if (wanderer !== undefined && delay_burning !== undefined) {
      return { ...delay_burning, wanderer: wanderer };
    }

    // Otherwise, just advance the next quest on the route
    const todo = this.tasks.find((task) => this.available(task));
    if (todo !== undefined) return todo;

    // No next task
    return undefined;
  }

  public execute(task: ActiveTask): void {
    debug(``);
    debug(`Executing ${task.name}`, "blue");
    this.checkLimits(task);
    super.execute(task);
    if (have($effect`Beaten Up`)) throw "Fight was lost; stop.";
    if (task.completed()) {
      debug(`${task.name} completed!`, "blue");
    } else {
      debug(`${task.name} not completed!`, "blue");
    }
  }

  customize(
    task: ActiveTask,
    outfit: Outfit,
    combat: CombatStrategy<CombatActions>,
    resources: CombatResources<CombatActions>
  ): void {
    equipInitial(outfit);
    const wanderers = task.wanderer ? [task.wanderer] : [];
    for (const wanderer of wanderers) {
      if (!outfit.equip(wanderer?.equip ?? []))
        throw `Wanderer equipment ${wanderer.equip} conflicts with ${task.name}`;
    }

    if (task.freeaction) {
      // Prepare only as requested by the task
      applyEffects(outfit.modifier ?? "", task.effects || []);
      return;
    }

    // Prepare combat macro
    if (combat.getDefaultAction() === undefined) combat.action("ignore");

    if (wanderers.length === 0) {
      // Set up a banish if needed
      const banishSources = unusedBanishes(
        combat.where("banish").filter((mon) => mon instanceof Monster)
      );
      resources.provide("banish", equipFirst(outfit, banishSources));

      // Set up a runaway if there are combats we do not care about
      let runaway = undefined;
      if (combat.can("ignore")) {
        runaway = equipFirst(outfit, runawaySources);
        resources.provide("ignore", runaway);
      }
      if (combat.can("ignoreNoBanish")) {
        if (runaway !== undefined && !runaway.banishes)
          resources.provide("ignoreNoBanish", runaway);
        else
          resources.provide(
            "ignoreNoBanish",
            equipFirst(
              outfit,
              runawaySources.filter((source) => !source.banishes)
            )
          );
      }

      // Set up a free kill if needed, or if no free kills will ever be needed again
      if (
        combat.can("killFree") ||
        (combat.can("kill") &&
          !task.boss &&
          this.tasks.every((t) => t.completed() || !t.combat?.can("killFree")))
      ) {
        resources.provide("killFree", equipFirst(outfit, freekillSources));
      }
    }

    // Set up more wanderers if delay is needed
    if (wanderers.length === 0 && this.hasDelay(task))
      wanderers.push(...equipUntilCapped(outfit, wandererSources));

    // Prepare full outfit
    if (!outfit.skipDefaults) {
      if (task.boss) outfit.equip($familiar`Machine Elf`);
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      if (!task.boss && !freecombat) outfit.equip($item`carnivorous potted plant`);
      if (
        canChargeVoid() &&
        !freecombat &&
        ((combat.can("kill") && !resources.has("killFree")) || combat.can("killHard") || task.boss)
      )
        outfit.equip($item`cursed magnifying glass`);
      equipDefaults(outfit);
    }

    // Prepare mood
    applyEffects(outfit.modifier ?? "", task.effects || []);

    // Kill wanderers
    for (const wanderer of wanderers) {
      combat.action("killHard", wanderer.monsters);
    }
    if (resources.has("killFree") && !task.boss) {
      // Upgrade normal kills to free kills if provided
      combat.action(
        "killFree",
        (combat.where("kill") ?? []).filter((mon) => !mon.boss)
      );
      if (combat.getDefaultAction() === "kill") combat.action("killFree");
    }
  }

  dress(task: Task, outfit: Outfit): void {
    super.dress(task, outfit);

    // HP/MP upkeep
    if (!task.freeaction) {
      if (myHp() < myMaxhp() / 2) useSkill($skill`Cannelloni Cocoon`);
      if (!have($effect`Super Skill`)) restoreMp(myMaxmp() < 200 ? myMaxmp() : 200);
    }
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    manager.set({
      louvreGoal: 7,
      louvreDesiredGoal: 7,
    });
    manager.setChoices({
      1106: 3, // Ghost Dog Chow
      1107: 1, // tennis ball
      1340: 3, // Is There A Doctor In The House?
      1341: 1, // Cure her poison
      // June cleaver noncombats
      1467: 1,
      1468: 1,
      1469: 2,
      1470: 2,
      1471: 1,
      1472: 2,
      1473: 2,
      1474: 2,
      1475: 1,
    });
  }
}
