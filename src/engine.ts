import { Location, myAdventures } from "kolmafia";
import { Task } from "./tasks/structure";
import { $effect, $familiar, $item, $skill, get, have, PropertiesManager } from "libram";
import {
  BuiltCombatStrategy,
  CombatResourceAllocation,
  CombatStrategy,
  MonsterStrategy,
} from "./combat";
import { Outfit } from "./outfit";
import { applyEffects } from "./moods";
import {
  adv1,
  buy,
  choiceFollowsFight,
  cliExecute,
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
  freekillSources,
  runawaySources,
  unusedBanishes,
  WandererSource,
  wandererSources,
} from "./resources";

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

  public available(task: Task): boolean {
    for (const after of task.after) {
      const after_task = this.tasks_by_name.get(after);
      if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
      if (!after_task.completed()) return false;
    }
    if (task.ready && !task.ready()) return false;
    if (myAdventures() === 0 && !task.noadventures) return false;
    return !task.completed();
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public getNextTask(): [Task, WandererSource?] | undefined {
    // First, check for any prioritized tasks
    const priority = this.tasks.find(
      (task) => this.available(task) && task.priority !== undefined && task.priority()
    );
    if (priority !== undefined) {
      return [priority];
    }

    // If a wanderer is up try to place it in a useful location
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    const delay_burning = this.tasks.find(
      (task) =>
        this.hasDelay(task) && this.available(task) && Outfit.create(task).canEquip(wanderer?.equip)
    );
    if (wanderer !== undefined && delay_burning !== undefined) {
      return [delay_burning, wanderer];
    }

    // Otherwise, just advance the next quest on the route
    const todo = this.tasks.find((task) => this.available(task));
    if (todo !== undefined) return [todo];

    // No next task
    return undefined;
  }

  public execute(task: Task, wanderer?: WandererSource): void {
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
      if (itemAmount(to_get.item) + equippedAmount(to_get.item) < num_needed && !to_get.optional) {
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
    const wanderers = wanderer ? [wanderer] : [];
    for (const wanderer of wanderers) {
      if (!outfit.equip(wanderer?.equip))
        throw `Wanderer equipment ${wanderer.equip} conflicts with ${task.name}`;
    }

    if (!task.freeaction) {
      // Prepare combat macro
      const task_combat = task.combat ?? new CombatStrategy();
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

      // Set up more wanderers if delay is needed
      if (wanderers.length === 0 && this.hasDelay(task))
        wanderers.push(...outfit.equipUntilCapped(wandererSources));

      // Prepare mood
      applyEffects(outfit.modifier ?? "", task.effects || []);

      // Prepare full outfit
      if (!outfit.skipDefaults) {
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
      }
      outfit.dress();

      // Prepare combat macro (after effects and outfit)
      const combat = new BuiltCombatStrategy(task_combat, combat_resources, wanderers);
      debug(combat.macro.toString(), "blue");
      setAutoAttack(0);
      combat.macro.save();

      // Prepare resources if needed
      wanderers.map((source) => source.prepare && source.prepare());
      combat_resources.all().map((source) => source.prepare && source.prepare());

      // HP/MP upkeep
      if (myHp() < myMaxhp() / 2) useSkill($skill`Cannelloni Cocoon`);
      if (!have($effect`Super Skill`)) restoreMp(myMaxmp() < 200 ? myMaxmp() : 200);
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

  public setUniversalProperties() {
    // Properties adapted from garbo
    this.propertyManager.set({
      logPreferenceChange: true,
      logPreferenceChangeFilter: [
        ...new Set([
          ...get("logPreferenceChangeFilter").split(","),
          "libram_savedMacro",
          "maximizerMRUList",
          "testudinalTeachings",
          "_lastCombatStarted",
        ]),
      ]
        .sort()
        .filter((a) => a)
        .join(","),
      battleAction: "custom combat script",
      autoSatisfyWithMall: true,
      autoSatisfyWithNPCs: true,
      autoSatisfyWithCoinmasters: true,
      autoSatisfyWithStash: false,
      dontStopForCounters: true,
      maximizerFoldables: true,
      hpAutoRecovery: 0.0,
      hpAutoRecoveryTarget: 0.0,
      mpAutoRecovery: 0.0,
      mpAutoRecoveryTarget: 0.0,
      afterAdventureScript: "",
      betweenBattleScript: "",
      choiceAdventureScript: "",
      familiarScript: "",
      currentMood: "apathetic",
      autoTuxedo: true,
      autoPinkyRing: true,
      autoGarish: true,
      allowNonMoodBurning: false,
      allowSummonBurning: true,
      libramSkillsSoftcore: "none",
      louvreGoal: 7,
      louvreDesiredGoal: 7,
    });
    this.propertyManager.setChoices({
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
