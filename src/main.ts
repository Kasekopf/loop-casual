import {
  gametimeToInt,
  getRevision,
  myAdventures,
  myPath,
  myTurncount,
  print,
  runChoice,
  svnAtHead,
  svnExists,
  turnsPlayed,
  visitUrl,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine/engine";
import { convertMilliseconds, debug } from "./lib";
import { get, set, sinceKolmafiaRevision } from "libram";
import { Prioritization } from "./engine/priority";
import { Args, step } from "grimoire-kolmafia";
import { checkRequirements } from "./sim";
import { globalStateCache } from "./engine/state";
import { lastCommitHash } from "./_git_commit";

const time_property = "_loop_gyou_first_start";
const svn_name = "Kasekopf-loop-casual-branches-release";

export const args = Args.create(
  "loopgyou",
  'This is a script to complete Grey You Softcore runs. Run "loopgyou sim" without quotes to check if this script will work for you.\n\nYou must ascend manually into a Grey You Softcore run before running the script. The cold medicine cabinet is required in your workshed. Prefer the Vole sign until you have finished most of the path progression. Astral mask or astral belt are both useful, but neither is required. Prefer candles for your eurdora.\n\nThe arguments accepted by the script are listed below. Note that you can combine multiple options; for example "loopgyou pulls=18 tune=blender" will save 2 pulls and switch moon sign to Blender during the run. Most options also have an associated setting to set an option permanently; for example "set loopgyou_pulls=18" will cause the script to always save 2 pulls (unless overriden by using the pulls option at runtime).',
  {
    sim: Args.flag({ help: "Check if you have the requirements to run this script.", setting: "" }),
    version: Args.flag({ help: "Show script version and exit.", setting: "" }),
    class: Args.number({
      help: "If given, break the prism and choose a class. <font color='red'>You will be reduced to 40 adventures with full organs after breaking the prism.</font>",
      options: [
        [1, "Seal Clubber"],
        [2, "Turtle Tamer"],
        [3, "Pastamancer"],
        [4, "Saurceror"],
        [5, "Disco Bandit"],
        [6, "Accordion Thief"],
      ],
    }),
    pulls: Args.number({
      help: "Number of pulls to use. Lower this if you would like to save some pulls to use for in-ronin farming. (Note that this argument is not needed if you pull all your farming items before running the script).",
      default: 20,
    }),
    tune: Args.string({
      help: "Use your hewn moon-rune spoon to retune to this sign when optimal.",
    }),
    delaytower: Args.flag({
      help: "Delay the NS tower until after ronin ends.",
      default: false,
    }),
    seasoning: Args.boolean({
      help: "If true, get special seasoning from SongBoom boombox after the beginning of the run.",
      default: true,
    }),
    actions: Args.number({
      help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
    }),
    verboseequip: Args.flag({
      help: "Print out equipment usage before each task.",
    }),
    fax: Args.boolean({
      help: "Use a fax to summon a monster. Set to false if the faxbots are offline.",
      default: true,
    }),
    ignoretasks: Args.string({
      help: "A comma-separated list of task names that should not be done. Can be used as a workaround for script bugs where a task is crashing.",
      setting: "",
    }),
    completedtasks: Args.string({
      help: "A comma-separated list of task names the should be treated as completed. Can be used as a workaround for script bugs.",
      setting: "",
    }),
    list: Args.flag({
      help: "Show the status of all tasks and exit.",
    }),
  }
);
export function main(command?: string): void {
  sinceKolmafiaRevision(26718);

  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.sim) {
    checkRequirements();
    return;
  }

  printVersionInfo();
  if (args.version) return;

  // eslint-disable-next-line eqeqeq
  if (myPath() != "Grey You") throw `You are not currently in a Grey You run. Please start one.`;

  // Break the prism and exit if requested
  if (args.class !== undefined) {
    breakPrism(args.class);
    return;
  }

  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  // Clear intro adventure
  set("choiceAdventure1464", 1);
  if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
    runChoice(-1);

  const tasks = prioritize(all_tasks());
  const engine = new Engine(
    tasks,
    args.ignoretasks?.split(",") ?? [],
    args.completedtasks?.split(",") ?? []
  );
  try {
    if (args.list) {
      listTasks(engine);
      return;
    }

    engine.run(args.actions);

    const remaining_tasks = tasks.filter((task) => !task.completed());
    if (!runComplete()) {
      if (args.actions) {
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
  print(`   Pulls used: ${get("_roninStoragePulls").split(",").length}`, "purple");
  // eslint-disable-next-line eqeqeq
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
    // eslint-disable-next-line eqeqeq
    myPath() != "Grey You" ||
    (args.delaytower && myTurncount() < 1000 && step("questL13Final") !== -1)
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
    const priority = Prioritization.from(task);
    const reason = priority.explain();
    const why = reason === "" ? "Route" : reason;
    debug(
      `${task.name}: ${task.completed()
        ? "Done"
        : engine.available(task)
          ? `Available [${priority.score()}: ${why}]`
          : "Not Available"
      }`,
      task.completed() ? "blue" : engine.available(task) ? undefined : "red"
    );
  }
}
