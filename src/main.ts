import {
  cliExecute,
  gametimeToInt,
  myAdventures,
  myPath,
  print,
  runChoice,
  turnsPlayed,
  visitUrl,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { convertMilliseconds, debug } from "./lib";
import { WandererSource, wandererSources } from "./resources";
import { $effect, get, have, PropertiesManager, set, sinceKolmafiaRevision } from "libram";
import { step, Task } from "./tasks/structure";
import { OverridePriority, Prioritization } from "./priority";
import { Outfit } from "./outfit";
import { removeTeleportitis, teleportitisTask } from "./tasks/misc";
import { Args } from "./args";
import { checkRequirements } from "./sim";
import { pullStrategy } from "./tasks/pulls";
import { keyStrategy } from "./tasks/keys";
import { GameState } from "./state";

const time_property = "_loop_gyou_first_start";

export const args = Args.create("loopgyou", "A script to complete gyou runs.", {
  sim: Args.flag({ help: "Check if you have the requirements to run this script" }),
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
  class: Args.number({
    help: "If given, break the prism and choose a class at the end of the run.",
    default: 0,
    options: [
      [0, "Stay as Grey You"],
      [1, "Seal Clubber"],
      [2, "Turtle Tamer"],
      [3, "Pastamancer"],
      [4, "Saurceror"],
      [5, "Disco Bandit"],
      [6, "Accordion Thief"],
    ],
  }),
  pulls: Args.number({
    help: "Number of pulls to use. Lower this if you would like to save some pulls for in-ronin farming.",
    default: 20,
  }),
  verboseequip: Args.flag({
    help: "Print out equipment usage before each task.",
  }),
  tune: Args.string({
    help: "Use your hewn moon-rune spoon to retune to this sign when optimal.",
  }),
});
export function main(command?: string): void {
  sinceKolmafiaRevision(26473);

  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.sim) {
    checkRequirements();
    return;
  }

  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  if (myPath() !== "Grey You") throw `You are not currently in a Grey You run. Please start one.`;

  // Clear intro adventure
  set("choiceAdventure1464", 1);
  if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
    runChoice(-1);

  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  try {
    let actions_left = args.actions ?? Number.MAX_VALUE;
    let state = new GameState();
    if (actions_left < 0) {
      // Update the strategy for the printout
      keyStrategy.update();
      pullStrategy.update();
      for (const task of tasks) {
        const priority = Prioritization.from(task, state);
        const reason = priority.explain();
        const why = reason === "" ? "Route" : reason;
        debug(
          `${task.name}: ${
            task.completed(state)
              ? "Done"
              : engine.available(task, state)
              ? `Available [${priority.score()}: ${why}]`
              : "Not Available"
          }`,
          task.completed(state) ? "blue" : engine.available(task, state) ? undefined : "red"
        );
      }
    }

    // Do not bother to set properties if there are no tasks remaining
    if (
      tasks.find((task) => !task.completed(state) && (task.ready?.(state) ?? true)) !== undefined
    ) {
      setUniversalProperties(engine.propertyManager);
      cliExecute("ccs loopgyou");
    }

    while (myAdventures() > 0) {
      // Note order matters for these strategy updates
      keyStrategy.update(); // Update key plan with current state
      pullStrategy.update(); // Update pull plan with current state

      const next = getNextTask(engine, tasks, state);
      if (next === undefined) break;
      if (actions_left <= 0) {
        debug(`Next task: ${next[0].name}`);
        return;
      } else {
        actions_left -= 1;
      }

      if (next[2] !== undefined) state = engine.execute(next[0], next[1], state, next[2]);
      else state = engine.execute(next[0], next[1], state);
      if (myPath() !== "Grey You") break; // Prism broken
    }

    const remaining_tasks = tasks.filter((task) => !task.completed(state));
    if (!runComplete()) {
      debug("Remaining tasks:", "red");
      for (const task of remaining_tasks) {
        if (!task.completed(state)) debug(`${task.name}`, "red");
      }
      throw `Unable to find available task, but the run is not complete.`;
    }
  } finally {
    engine.propertyManager.resetAll();
  }

  const state = new GameState();
  print("Grey you complete!", "purple");
  print(`   Adventures used: ${turnsPlayed()}`, "purple");
  print(`   Adventures remaining: ${myAdventures()}`, "purple");
  if (set_time_now)
    print(
      `   Time: ${convertMilliseconds(gametimeToInt() - get(time_property, gametimeToInt()))}`,
      "purple"
    );
  else
    print(
      `   Time: ${convertMilliseconds(
        gametimeToInt() - get(time_property, gametimeToInt())
      )} since first run today started`,
      "purple"
    );
  print(`   Pulls used: ${pullStrategy.pullsUsed()}`, "purple");
  if (myPath() === "Grey You") {
    print(
      `   Monsters remaining: ${Array.from(state.absorb.remainingAbsorbs()).join(", ")}`,
      "purple"
    );
    print(
      `   Reprocess remaining: ${Array.from(state.absorb.remainingReprocess()).join(", ")}`,
      "purple"
    );
  }
}

function getNextTask(
  engine: Engine,
  tasks: Task[],
  state: GameState
): [Task, Prioritization, WandererSource?] | undefined {
  const available_tasks = tasks.filter((task) => engine.available(task, state));

  // Teleportitis overrides all
  if (have($effect`Teleportitis`)) {
    const tele = teleportitisTask(engine, tasks, state);
    if (tele.completed(state) && removeTeleportitis.ready()) {
      return [removeTeleportitis, Prioritization.fixed(OverridePriority.Always)];
    }
    return [tele, Prioritization.fixed(OverridePriority.Always)];
  }

  // First, check for any heavily prioritized tasks
  const priority = available_tasks.find(
    (task) => task.priority?.() === OverridePriority.LastCopyableMonster
  );
  if (priority !== undefined) {
    return [priority, Prioritization.fixed(OverridePriority.LastCopyableMonster)];
  }

  // If a wanderer is up try to place it in a useful location
  const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
  const delay_burning = available_tasks.find(
    (task) => engine.hasDelay(task) && Outfit.create(task, state).canEquip(wanderer?.equip)
  );
  if (wanderer !== undefined && delay_burning !== undefined) {
    return [delay_burning, Prioritization.fixed(OverridePriority.Wanderer), wanderer];
  }

  // Next, choose tasks by priorty, then by route.
  const task_priorities = available_tasks.map(
    (task) => [task, Prioritization.from(task, state)] as [Task, Prioritization]
  );
  const highest_priority = Math.max(...task_priorities.map((tp) => tp[1].score()));
  const todo = task_priorities.find((tp) => tp[1].score() === highest_priority);
  if (todo !== undefined) {
    return todo;
  }
  // No next task
  return undefined;
}

function runComplete(): boolean {
  return step("questL13Final") > 11 || myPath() !== "Grey You";
}

function setUniversalProperties(propertyManager: PropertiesManager) {
  // Properties adapted from garbo
  propertyManager.set({
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
    hpAutoRecovery: "0.0",
    hpAutoRecoveryTarget: "0.0",
    mpAutoRecovery: "0.0",
    mpAutoRecoveryTarget: "0.0",
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
  });
  propertyManager.setChoices({
    1106: 3, // Ghost Dog Chow
    1107: 1, // tennis ball
    1340: 3, // Is There A Doctor In The House?
    1341: 1, // Cure her poison
  });
}
