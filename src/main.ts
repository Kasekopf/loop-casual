import {
  gametimeToInt,
  getRevision,
  inHardcore,
  myAdventures,
  myPath,
  myTurncount,
  print,
  pullsRemaining,
  runChoice,
  svnAtHead,
  svnExists,
  turnsPlayed,
  userConfirm,
  visitUrl,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine/engine";
import { convertMilliseconds, debug } from "./lib";
import { $item, $path, get, set, sinceKolmafiaRevision } from "libram";
import { Prioritization } from "./engine/priority";
import { Args, step } from "grimoire-kolmafia";
import { checkRequirements } from "./sim";
import { globalStateCache } from "./engine/state";
import { lastCommitHash } from "./_git_commit";
import { args } from "./args";

const time_property = "_loop_gyou_first_start";
const svn_name = "Kasekopf-loop-casual-branches-release";

export function main(command?: string): void {
  sinceKolmafiaRevision(27488);

  Args.fill(args, command);
  if (args.debug.settings) {
    debug(JSON.stringify(args));
    return;
  }
  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.sim) {
    checkRequirements();
    return;
  }
  if (args.major.delaytower) {
    if (
      !userConfirm(
        "With the January nerf to the Grey You path, delaytower is not generally useful (since we are not able to break ronin with the adventures from the first day). Are you sure you want to continue with delaytower enabled?"
      )
    ) {
      return;
    }
  }

  printVersionInfo();
  if (args.version) return;

  if (myPath() !== $path`Grey You` && !args.debug.list)
    throw `You are not currently in a Grey You run. Please start one.`;

  // Break the prism and exit if requested
  if (args.class !== undefined) {
    breakPrism(args.class);
    return;
  }

  // Adapt depreciated args
  if (args.minor.asdon) args.major.swapworkshed = $item`Asdon Martin keyfob`;

  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  // Clear intro adventure
  set("choiceAdventure1464", 1);
  if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
    runChoice(-1);

  const tasks = prioritize(all_tasks());
  const engine = new Engine(
    tasks,
    args.debug.ignoretasks?.split(",") ?? [],
    args.debug.completedtasks?.split(",") ?? []
  );
  try {
    if (args.debug.list) {
      listTasks(engine);
      return;
    }

    engine.run(args.debug.actions);

    const remaining_tasks = tasks.filter((task) => !task.completed());
    if (!runComplete()) {
      if (args.debug.actions !== undefined) {
        const next = engine.getNextTask();
        if (next) {
          debug(`Next task: ${next.name}`);
          return;
        }
      }

      debug("Remaining tasks:", "red");
      for (const task of remaining_tasks) {
        if (!task.completed()) debug(`${task.name}`, "red");
      }
      throw `Unable to find available task, but the run is not complete.`;
    }
  } finally {
    engine.propertyManager.resetAll();
  }

  const absorb_state = globalStateCache.absorb();
  if (step("questL13Final") > 11) {
    print("Grey you complete!", "purple");
  } else {
    print("Grey you partially complete! Rerun after ronin ends.", "purple");
  }
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
  if (inHardcore()) {
    print(`   Pulls used: 0 (Hardcore)`);
  } else {
    print(
      `   Pulls used: ${get("_loopgyou_pulls_used")} (${pullsRemaining()} remaining)`,
      "purple"
    );
  }
  print(
    `   Monsters remaining: ${Array.from(absorb_state.remainingAbsorbs()).join(", ")}`,
    "purple"
  );
  print(
    `   Reprocess remaining: ${Array.from(absorb_state.remainingReprocess()).join(", ")}`,
    "purple"
  );
}

function runComplete(): boolean {
  return (
    step("questL13Final") > 11 ||
    myPath() !== $path`Grey You` ||
    (args.major.delaytower && myTurncount() < 1000 && step("questL13Final") !== -1) ||
    (args.major.delaywar &&
      myTurncount() < 1000 &&
      step("questL02Larva") === 999 &&
      step("questL03Rat") === 999 &&
      step("questL04Bat") === 999 &&
      step("questL05Goblin") === 999 &&
      step("questL06Friar") === 999 &&
      step("questL07Cyrptic") === 999 &&
      step("questL08Trapper") === 999 &&
      step("questL09Topping") === 999 &&
      step("questL10Garbage") === 999 &&
      step("questL11MacGuffin") === 999)
  );
}

function printVersionInfo(): void {
  debug(
    `Running loopgyou version [${lastCommitHash ?? "custom-built"}] in KoLmafia r${getRevision()}`
  );
  if (lastCommitHash !== undefined) {
    if (svnExists(svn_name) && !svnAtHead(svn_name))
      debug(
        'A newer version of this script is available and can be obtained with "svn update".',
        "red"
      );
    else if (args.version) {
      debug("This script is up to date.", "red");
    }
  }
}

function breakPrism(into_class: number): void {
  if (step("questL13Final") <= 11)
    throw `You have not finished your Grey You run. Do not set this argument yet.`;
  const absorb_state = globalStateCache.absorb();
  print(
    `   Monsters remaining: ${Array.from(absorb_state.remainingAbsorbs()).join(", ")}`,
    "purple"
  );
  print(
    `   Reprocess remaining: ${Array.from(absorb_state.remainingReprocess()).join(", ")}`,
    "purple"
  );
  if (step("questL13Final") === 999) return;
  visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
  visitUrl("main.php");
  runChoice(into_class);
  runChoice(into_class);
}

function listTasks(engine: Engine): void {
  engine.updatePlan();
  for (const task of engine.tasks) {
    if (task.completed()) {
      debug(`${task.name}: Done`, "blue");
    } else {
      if (engine.available(task)) {
        const priority = Prioritization.from(task);
        const reason = priority.explain();
        const why = reason === "" ? "Route" : reason;
        debug(`${task.name}: Available [${priority.score()}: ${why}]`);
      } else {
        debug(`${task.name}: Not Available`, "red");
      }
    }
  }
}
