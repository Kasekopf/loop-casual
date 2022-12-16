import { Args } from "grimoire-kolmafia";

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
      setting: "",
    }),
    major: Args.group("Major Options", {
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
      delaywar: Args.flag({
        help: "Delay the war until after ronin ends, then finish with stuffing fluffers.",
        default: false,
      }),
      chargegoose: Args.number({
        help: "If true, use extra familiar turns to charge your Grey Goose to this weight at the end of the run (for aftercore leveling). If you do not have enough extra familiar turns, the goose may be lower level.",
        default: 20,
      }),
    }),
    minor: Args.group("Minor Options", {
      fax: Args.boolean({
        help: "Use a fax to summon a monster. Set to false if the faxbots are offline.",
        default: true,
      }),
      seasoning: Args.boolean({
        help: "If true, get special seasoning from SongBoom boombox after the beginning of the run.",
        default: true,
      }),
      lgr: Args.flag({
        help: "Pull a lucky gold ring. If pulled, it will be equipped during many combats.",
        default: false,
      }),
      asdon: Args.flag({
        help: "Pull an Asdon Martin keyfob. If pulled, it will be used to replace the cold medicine cabinet once all Extrovermectin™ have been obtained.",
        default: false,
      }),
      jellies: Args.flag({
        help: "Use your Space Jellyfish to get stench jellies during the war (this may reduce your goose familiar exp).",
        default: false,
      }),
      pvp: Args.flag({
        help: "Break your hippy stone at the start of the run.",
        default: false,
      }),
      wand: Args.flag({
        help: "Always get the zap wand.",
        default: false,
      }),
      skills: Args.string({
        help: "A comma-separated list of skills to get, in addition to skills that will directly help the run.",
        default: "Financial Spreadsheets",
      }),
      forcelocket: Args.flag({
        help: "Always equip the combat lover's locket, in order to get monsters inside quickly.",
        default: false,
      }),
    }),
    debug: Args.group("Debug Options", {
      actions: Args.number({
        help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
      }),
      verboseequip: Args.flag({
        help: "Print out equipment usage before each task.",
      }),
      ignoretasks: Args.string({
        help: "A comma-separated list of task names that should not be done. Can be used as a workaround for script bugs where a task is crashing.",
      }),
      completedtasks: Args.string({
        help: "A comma-separated list of task names the should be treated as completed. Can be used as a workaround for script bugs.",
      }),
      list: Args.flag({
        help: "Show the status of all tasks and exit.",
        setting: "",
      }),
      settings: Args.flag({
        help: "Show the parsed value for all arguments and exit.",
        setting: "",
      }),
      lastasdonbumperturn: Args.number({
        help: "Set the last usage of Asdon Martin: Spring-Loaded Front Bumper, in case of a tracking issue",
        hidden: true,
      }),
      ignorekeys: Args.flag({
        help: "Ignore the check that all keys can be obtained. Typically for hardcore, if you plan to get your own keys",
        default: false,
      }),
    }),
  },
  {
    defaultGroupName: "Commands",
  }
);
