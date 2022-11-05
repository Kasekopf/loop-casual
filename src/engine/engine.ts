import {
  autosell,
  autosellPrice,
  descToItem,
  eat,
  equippedItem,
  familiarWeight,
  getInventory,
  getWorkshed,
  haveEffect,
  haveEquipped,
  Item,
  Location,
  Monster,
  myAdventures,
  myBasestat,
  myBuffedstat,
  myHp,
  myLevel,
  myMaxhp,
  myMaxmp,
  myMeat,
  myMp,
  myPath,
  myTurncount,
  overdrink,
  print,
  putCloset,
  restoreHp,
  restoreMp,
  Slot,
  toInt,
  totalTurnsPlayed,
  toUrl,
  use,
  visitUrl,
} from "kolmafia";
import { Task } from "./task";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $path,
  $skill,
  $stat,
  get,
  getTodaysHolidayWanderers,
  have,
  Macro,
  PropertiesManager,
  set,
  uneffect,
} from "libram";
import { Engine as BaseEngine, CombatResources, CombatStrategy, Outfit } from "grimoire-kolmafia";
import { CombatActions, MyActionDefaults } from "./combat";
import {
  equipCharging,
  equipDefaults,
  equipFirst,
  equipInitial,
  equipUntilCapped,
  fixFoldables,
} from "./outfit";
import { cliExecute, equippedAmount, itemAmount, runChoice } from "kolmafia";
import { atLevel, debug } from "../lib";
import {
  canChargeVoid,
  forceItemSources,
  freekillSources,
  refillLatte,
  runawaySources,
  shouldFinishLatte,
  WandererSource,
  wandererSources,
  yellowRaySources,
} from "./resources";
import { OverridePriority, Prioritization } from "./priority";
import { args } from "../main";
import { flyersDone } from "../tasks/level12";
import { globalStateCache } from "./state";
import { removeTeleportitis, teleportitisTask } from "../tasks/misc";
import { extraReprocessTargets, summonStrategy } from "../tasks/summons";
import { pullStrategy } from "../tasks/pulls";
import { keyStrategy } from "../tasks/keys";
import { applyEffects } from "./moods";

export const wanderingNCs = new Set<string>([
  "Wooof! Wooooooof!",
  "Playing Fetch*",
  "A Pound of Cure",
  "Aunts not Ants",
  "Bath Time",
  "Beware of Aligator",
  "Delicious Sprouts",
  "Hypnotic Master",
  "Lost and Found",
  "Poetic Justice",
  "Summer Days",
  "Teacher's Pet",
]);

type ActiveTask = Task & {
  wanderer?: WandererSource;
  active_priority?: Prioritization;
};

export class Engine extends BaseEngine<CombatActions, ActiveTask> {
  constructor(tasks: Task[], ignoreTasks: string[], completedTasks: string[]) {
    const ignore_set = new Set<string>(ignoreTasks.map((n) => n.trim()));
    const completed_set = new Set<string>(completedTasks.map((n) => n.trim()));
    // Completed tasks are always completed, ignored tasks are never ready
    tasks = tasks.map((task) => {
      if (completed_set.has(task.name)) return { ...task, completed: () => true };
      if (ignore_set.has(task.name)) return { ...task, ready: () => false };
      return task;
    });
    super(tasks, { combat_defaults: new MyActionDefaults() });

    for (const task of ignore_set) {
      if (!this.tasks_by_name.has(task)) debug(`Warning: Unknown ignoretask ${task}`);
    }
    for (const task of completed_set) {
      if (!this.tasks_by_name.has(task)) debug(`Warning: Unknown completedtask ${task}`);
    }
  }

  public available(task: Task): boolean {
    // Wait until we get Infinite Loop before doing most things
    if (task.do instanceof Location && !have($skill`Infinite Loop`)) return false;

    return super.available(task);
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public getNextTask(): ActiveTask | undefined {
    const available_tasks = this.tasks.filter((task) => this.available(task));
    this.updatePlan();

    // eslint-disable-next-line eqeqeq
    if (myPath() !== $path`Grey You`) return undefined; // Prism broken

    // Teleportitis overrides all
    if (have($effect`Teleportitis`)) {
      const teleportitis = teleportitisTask(this, this.tasks);
      if (teleportitis.completed() && removeTeleportitis.ready()) {
        return {
          ...removeTeleportitis,
          active_priority: Prioritization.fixed(OverridePriority.Always),
        };
      }
      return { ...teleportitis, active_priority: Prioritization.fixed(OverridePriority.Always) };
    }

    // First, check for any heavily prioritized tasks
    const priority = available_tasks.find(
      (task) => task.priority?.() === OverridePriority.LastCopyableMonster
    );
    if (priority !== undefined) {
      return {
        ...priority,
        active_priority: Prioritization.fixed(OverridePriority.LastCopyableMonster),
      };
    }

    // If a wanderer is up try to place it in a useful location
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    const delay_burning = available_tasks.find(
      (task) => this.hasDelay(task) && this.createOutfit(task).canEquip(wanderer?.equip ?? [])
    );
    if (wanderer !== undefined && delay_burning !== undefined) {
      return {
        ...delay_burning,
        active_priority: Prioritization.fixed(OverridePriority.Wanderer),
        wanderer: wanderer,
      };
    }

    // Next, choose tasks by priorty, then by route.
    const task_priorities = available_tasks.map((task) => {
      return { ...task, active_priority: Prioritization.from(task) };
    });
    const highest_priority = Math.max(...task_priorities.map((tp) => tp.active_priority.score()));
    const todo = task_priorities.find((tp) => tp.active_priority.score() === highest_priority);
    if (todo !== undefined) {
      return todo;
    }

    // No next task
    return undefined;
  }

  public execute(task: ActiveTask): void {
    debug(``);
    const reason = task.active_priority?.explain() ?? "";
    const why = reason === "" ? "Route" : reason;
    debug(`Executing ${task.name} [${why}]`, "blue");
    this.checkLimits({ ...task, limit: { ...task.limit, unready: false } }, () => true); // ignore unready for this initial check
    super.execute(task);

    if (task.completed()) {
      debug(`${task.name} completed!`, "blue");
    } else if (!(task.ready?.() ?? true)) {
      debug(`${task.name} not completed! [Again? Not ready]`, "blue");
    } else {
      const priority_explain = Prioritization.from(task).explain();
      if (priority_explain !== "") {
        debug(`${task.name} not completed! [Again? ${priority_explain}]`, "blue");
      } else {
        debug(`${task.name} not completed!`, "blue");
      }
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

    if (
      (typeof task.freeaction === "boolean" && task.freeaction) ||
      (typeof task.freeaction === "function" && task.freeaction())
    ) {
      // Prepare only as requested by the task
      return;
    }

    // Prepare combat macro
    if (combat.getDefaultAction() === undefined) combat.action("ignore");

    // Use rock-band flyers if needed (300 extra as a buffer for mafia tracking)
    const blacklist = new Set<Location>(
      $locations`The Copperhead Club, The Black Forest, Oil Peak`
    );
    const monster_blacklist = [
      ...getTodaysHolidayWanderers(),
      $monster`sausage goblin`,
      $monster`ninja snowman assassin`,
      $monster`Protagonist`,
      $monster`Quantum Mechanic`,
      $monster`government bureaucrat`,
      $monster`terrible mutant`,
      $monster`angry ghost`,
      $monster`annoyed snake`,
      $monster`slime blob`,
    ];
    if (
      myBasestat($stat`Moxie`) >= 200 &&
      myBuffedstat($stat`Moxie`) >= 200 &&
      have($item`rock band flyers`) &&
      !flyersDone() &&
      (!(task.do instanceof Location) || !blacklist.has(task.do)) &&
      task.name !== "Misc/Protonic Ghost"
    ) {
      combat.macro(
        new Macro().if_(
          `!hpbelow 50 && ${monster_blacklist.map((m) => `!monsterid ${m.id}`).join(" && ")}`,
          new Macro().tryItem($item`rock band flyers`)
        ),
        undefined,
        true
      );
    }

    // Absorb targeted monsters
    const absorb_state = globalStateCache.absorb();
    const absorb_targets = new Set<Monster>();
    if (task.do instanceof Location) {
      // If we have teleportitis, everything is a possible target
      const zone = have($effect`Teleportitis`) ? undefined : task.do;
      for (const monster of absorb_state.remainingAbsorbs(zone)) absorb_targets.add(monster);
      for (const monster of absorb_state.remainingReprocess(zone)) absorb_targets.add(monster);
    }
    for (const monster of absorb_targets) {
      if (absorb_state.isReprocessTarget(monster)) {
        outfit.equip($familiar`Grey Goose`);
        combat.autoattack(new Macro().trySkill($skill`Re-Process Matter`), monster);
        combat.macro(new Macro().trySkill($skill`Re-Process Matter`), monster, true);
        debug(`Target x2: ${monster.name}`, "purple");
      } else {
        debug(`Target: ${monster.name}`, "purple");
      }
      const strategy = combat.currentStrategy(monster);
      if (
        strategy === "ignore" ||
        strategy === "banish" ||
        strategy === "ignoreNoBanish" ||
        strategy === "ignoreSoftBanish"
      ) {
        combat.action("kill", monster); // TODO: KillBanish for Banish, KillNoBanish for IgnoreNoBanish
      }
    }

    let force_charge_goose = false;
    if (wanderers.length === 0) {
      // Set up a banish if needed

      if (combat.can("yellowRay") && !have($effect`Everything Looks Yellow`)) {
        resources.provide("yellowRay", equipFirst(outfit, yellowRaySources));
      }
      if (combat.can("forceItems")) {
        let source = undefined;
        if (!have($effect`Everything Looks Yellow`)) source = equipFirst(outfit, yellowRaySources);
        if (source === undefined) source = equipFirst(outfit, forceItemSources);
        resources.provide("forceItems", source);
      }

      const banish_state = globalStateCache.banishes();
      if (combat.can("banish") && !banish_state.isFullyBanished(task)) {
        const available_tasks = this.tasks.filter((task) => this.available(task));
        const banishSources = banish_state.unusedBanishes(available_tasks);
        resources.provide("banish", equipFirst(outfit, banishSources));
        debug(
          `Banish targets: ${combat
            .where("banish")
            .filter((monster) => !banish_state.already_banished.has(monster))
            .join(", ")}`
        );
        debug(
          `Banishes available: ${Array.from(banishSources)
            .map((b) => b.do)
            .join(", ")}`
        );
      }

      // Don't equip the orb if we have a bad target
      if (task.active_priority?.has(OverridePriority.BadOrb)) {
        outfit.equip({ avoid: $items`miniature crystal ball` });
      }

      // Equip an orb if we have a good target.
      // (If we have banished all the bad targets, there is no need to force an orb)
      if (
        task.active_priority?.has(OverridePriority.GoodOrb) &&
        (!combat.can("banish") || !banish_state.isFullyBanished(task))
      ) {
        outfit.equip($item`miniature crystal ball`);
        // If we are going to reprocess, it is useful to charge the goose
        if (
          (task.do instanceof Location &&
            absorb_state.isReprocessTarget(
              globalStateCache.orb().prediction(task.do) ?? $monster`none`
            )) ||
          [
            "Summon/Little Man In The Canoe",
            "Summon/One-Eyed Willie",
            "Summon/Revolving Bugbear",
            "Summon/Cloud Of Disembodied Whiskers",
            "Summon/Vicious Gnauga",
          ].includes(task.name)
        ) {
          force_charge_goose = true;
        }
      }

      // Set up a runaway if there are combats we do not care about
      let runaway = undefined;
      if (
        (combat.can("ignore") || combat.can("ignoreSoftBanish")) &&
        familiarWeight($familiar`Grey Goose`) >= 6 &&
        myLevel() >= 11
      ) {
        runaway = equipFirst(outfit, runawaySources);
        resources.provide("ignore", runaway);
        resources.provide("ignoreSoftBanish", runaway);
      }
      if (
        combat.can("ignoreNoBanish") &&
        familiarWeight($familiar`Grey Goose`) >= 6 &&
        myLevel() >= 11
      ) {
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
      // (after L11, when Infinite Loop is less important)
      if (
        combat.can("killFree") ||
        (combat.can("kill") &&
          !task.boss &&
          this.tasks.every((t) => t.completed() || !t.combat?.can("killFree")) &&
          atLevel(11))
      ) {
        resources.provide("killFree", equipFirst(outfit, freekillSources));
      }
    }

    if (args.major.chargegoose > familiarWeight($familiar`Grey Goose`)) {
      // If all the remaining monsters are summonable, then either we are about
      // to summon one (and so we want to charge the goose during that fight)
      // or all remaining summons are inaccesible (and so it is time to
      // overcharge the goose)
      const summonedMonsters = new Set<Monster>(
        extraReprocessTargets.filter((t) => t.needed()).map((t) => t.target)
      );
      if (!have($item`miniature crystal ball`)) summonedMonsters.add($monster`irate mariachi`); // will be skipped
      if (absorb_state.remainingReprocess().find((m) => !summonedMonsters.has(m)) === undefined) {
        force_charge_goose = true;
      }
    }
    equipCharging(outfit, force_charge_goose);

    if (wanderers.length === 0 && this.hasDelay(task))
      wanderers.push(...equipUntilCapped(outfit, wandererSources));

    // Prepare full outfit
    if (!outfit.skipDefaults) {
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      if (
        canChargeVoid() &&
        (!outfit.modifier || !outfit.modifier.includes("-combat")) &&
        !freecombat &&
        ((combat.can("kill") && !resources.has("killFree")) || combat.can("killHard") || task.boss)
      )
        outfit.equip($item`cursed magnifying glass`);

      equipDefaults(outfit, force_charge_goose);
    }

    // Kill wanderers
    for (const wanderer of wanderers) {
      for (const monster of wanderer.monsters) {
        if (combat.currentStrategy(monster) !== "killHard") {
          combat.action("killHard", monster);
          if (wanderer.action) combat.macro(wanderer.action, monster);
        }
      }
    }

    // Kill holiday wanderers
    const holidayMonsters = getTodaysHolidayWanderers();
    // TODO: better detection of which zones holiday monsters can appear
    if (holidayMonsters.length > 0 && !task.boss) combat.action("ignore", ...holidayMonsters);

    // Upgrade normal kills to free kills if provided
    if (resources.has("killFree") && !task.boss) {
      combat.action(
        "killFree",
        (combat.where("kill") ?? []).filter((mon) => !mon.boss)
      );
      if (combat.getDefaultAction() === "kill") combat.action("killFree");
    }
  }

  createOutfit(task: Task): Outfit {
    const spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
    const outfit = new Outfit();
    if (spec !== undefined) outfit.equip(spec); // no error on failure
    return outfit;
  }

  dress(task: ActiveTask, outfit: Outfit): void {
    try {
      outfit.dress();
    } catch {
      // If we fail to dress, this is maybe just a mafia desync.
      // So refresh our inventory and try again (once).
      debug("Possible mafia desync detected; refreshing...");
      cliExecute("refresh all");
      outfit.dress({ forceUpdate: true });
    }
    fixFoldables(outfit);
    applyEffects(outfit.modifier ?? "");

    if (args.debug.verboseequip) {
      const equipped = [...new Set(Slot.all().map((slot) => equippedItem(slot)))];
      print(`Equipped: ${equipped.join(", ")}`);
    }

    if (
      (typeof task.freeaction === "boolean" && task.freeaction) ||
      (typeof task.freeaction === "function" && task.freeaction())
    ) {
      // Prepare only as requested by the task
      return;
    }

    // HP/MP upkeep
    if (
      (have($effect`Once-Cursed`) || have($effect`Twice-Cursed`) || have($effect`Thrice-Cursed`)) &&
      get("hiddenApartmentProgress") < 7
    ) {
      this.propertyManager.set({
        hpAutoRecoveryItems: ensureRecovery("hpAutoRecoveryItems", [], ["relaxing hot tub"]),
      });
    } else {
      this.propertyManager.set({
        hpAutoRecoveryItems: ensureRecovery("hpAutoRecoveryItems", ["relaxing hot tub"], []),
      });
    }
    if (myHp() < 50 && myHp() < myMaxhp()) restoreHp(myMaxhp() < 50 ? myMaxhp() : 50);
    if (myMp() < 40 && myMaxmp() >= 40) customRestoreMp(40);
    else if (myMp() < 20) customRestoreMp(20);
  }

  setChoices(task: ActiveTask, manager: PropertiesManager): void {
    super.setChoices(task, manager);
    if (equippedAmount($item`June cleaver`) > 0) {
      this.propertyManager.setChoices({
        // June cleaver noncombats
        1467: 3, // +adv
        1468: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1469: get("_juneCleaverSkips", 0) < 5 ? 4 : 3,
        1470: 2, // teacher's pen
        1471: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1472: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1473: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1474: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1475: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
      });
    }
  }

  setCombat(
    task: ActiveTask,
    task_combat: CombatStrategy<CombatActions>,
    task_resources: CombatResources<CombatActions>
  ): void {
    // Always be ready to fight sausage goblins if we equip Kramco
    if (
      haveEquipped($item`Kramco Sausage-o-Matic™`) &&
      task_combat.currentStrategy($monster`sausage goblin`) !== "killHard"
    ) {
      task_combat.action("killHard", $monster`sausage goblin`);
      task_combat.macro(
        new Macro().trySkill($skill`Emit Matter Duplicating Drones`),
        $monster`sausage goblin`
      );
    }

    super.setCombat(task, task_combat, task_resources);
  }

  do(task: ActiveTask): void {
    const beaten_turns = haveEffect($effect`Beaten Up`);
    const start_advs = myAdventures();
    const goose_weight = familiarWeight($familiar`Grey Goose`);
    super.do(task);
    if (myAdventures() !== start_advs) getExtros();

    // Crash if we unexpectedly lost the fight
    if (!task.expectbeatenup && have($effect`Beaten Up`) && haveEffect($effect`Beaten Up`) !== 5) {
      // Poetic Justice gives 5
      if (
        haveEffect($effect`Beaten Up`) > beaten_turns || // Turns of beaten-up increased, so we lost
        (haveEffect($effect`Beaten Up`) === beaten_turns &&
          // Turns of beaten-up was constant but adventures went down, so we lost fight while already beaten up
          (myAdventures() < start_advs ||
            // Check if adventures went down but also we reprocessed a monster
            (familiarWeight($familiar`Grey Goose`) < goose_weight &&
              (myAdventures() === start_advs + 4 ||
                myAdventures() === start_advs + 6 ||
                myAdventures() === start_advs + 9))))
      )
        throw `Fight was lost (debug info: ${beaten_turns} => ${haveEffect(
          $effect`Beaten Up`
        )}, (${start_advs} => ${myAdventures()}); stop.`;
    }
  }

  post(task: ActiveTask): void {
    super.post(task);

    if (task.active_priority?.has(OverridePriority.BadOrb)) resetBadOrb();
    if (get("_latteBanishUsed") && shouldFinishLatte()) refillLatte();
    absorbConsumables();
    autosellJunk();
    for (const poisoned of $effects`Hardly Poisoned at All, A Little Bit Poisoned, Somewhat Poisoned, Really Quite Poisoned, Majorly Poisoned, Toad In The Hole`) {
      if (have(poisoned)) uneffect(poisoned);
    }
    globalStateCache.invalidate();
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    manager.set({
      louvreGoal: 7,
      louvreDesiredGoal: 7,
      requireBoxServants: false,
      autoAbortThreshold: "-0.05",
      recoveryScript: "",
      mpAutoRecoveryItems: ensureRecovery(
        "mpAutoRecoveryItems",
        ["black cherry soda", "doc galaktik's invigorating tonic"],
        [
          "rest in your campaway tent",
          "rest at the chateau",
          "rest at your campground",
          "sleep on your clan sofa",
        ]
      ),
      hpAutoRecoveryItems: ensureRecovery(
        "hpAutoRecoveryItems",
        ["scroll of drastic healing", "doc galaktik's homeopathic elixir"],
        [
          "rest in your campaway tent",
          "rest at the chateau",
          "rest at your campground",
          "sleep on your clan sofa",
        ]
      ),
    });
    manager.setChoices({
      1106: 3, // Ghost Dog Chow
      1107: 1, // tennis ball
      1340: 3, // Is There A Doctor In The House?
      1341: 1, // Cure her poison
    });
  }

  updatePlan(): void {
    // Note order matters for these strategy updates
    globalStateCache.invalidate();
    summonStrategy.update(); // Update summon plan with current state
    keyStrategy.update(); // Update key plan with current state
    pullStrategy.update(); // Update pull plan with current state
  }
}

const consumables_blacklist = new Set<Item>(
  $items`wet stew, wet stunt nut stew, stunt nuts, astral pilsner, astral hot dog dinner, giant marshmallow, booze-soaked cherry, sponge cake, gin-soaked blotter paper, steel margarita, bottle of Chateau de Vinegar, Bowl of Scorpions, unnamed cocktail, Flamin' Whatshisname, goat cheese, Extrovermectin™, blueberry muffin, bran muffin, chocolate chip muffin, Schrödinger's thermos, quantum taco, pirate fork, everfull glass, [glitch season reward name], Affirmation Cookie`
);
function autosellJunk(): void {
  // eslint-disable-next-line eqeqeq
  if (myPath() !== $path`Grey You`) return; // final safety
  if (myMeat() >= 10000) return;
  if (myTurncount() >= 1000) return; // stop after breaking ronin
  if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);

  // Sell junk items
  const junk = $items`hamethyst, baconstone, meat stack, dense meat stack, facsimile dictionary, space blanket, 1\,970 carat gold, black snake skin, demon skin, hellion cube, adder bladder, weremoose spit, Knob Goblin firecracker, wussiness potion, diamond-studded cane, Knob Goblin tongs, Knob Goblin scimitar, eggbeater, red-hot sausage fork, Knob Goblin pants, awful poetry journal, black pixel, pile of dusty animal bones, 1952 Mickey Mantle card, liquid ice`;
  for (const item of junk) {
    if (have(item)) autosell(item, itemAmount(item));
  }

  // Sell all but one of a few items
  const partial_junk = $items`ruby W, metallic A, lowercase N, heavy D`;
  for (const item of partial_junk) {
    if (itemAmount(item) > 1) autosell(item, itemAmount(item) - 1);
  }

  // Use wallets
  const wallets = $items`ancient vinyl coin purse, black pension check, old leather wallet, Gathered Meat-Clip, old coin purse`;
  for (const item of wallets) {
    if (have(item)) use(item, itemAmount(item));
  }

  // Sell extra consumables (after 1 has been absorbed)
  for (const item_name in getInventory()) {
    const item = Item.get(item_name);
    if (consumables_blacklist.has(item)) continue;
    if (autosellPrice(item) === 0) continue;
    if (item.inebriety > 0 || item.fullness > 0 || item.spleen > 0) {
      autosell(item, itemAmount(item));
    }
  }
}

function absorbConsumables(): void {
  // eslint-disable-next-line eqeqeq
  if (myPath() !== $path`Grey You`) return; // final safety
  if (myTurncount() >= 1000) return; // stop after breaking ronin

  let absorbed_list = get("_loop_gyou_absorbed_consumables", "");
  const absorbed = new Set<string>(absorbed_list.split(","));

  for (const item_name in getInventory()) {
    const item = Item.get(item_name);
    const item_id = `${toInt(item)}`;
    if (consumables_blacklist.has(item)) continue;
    if (item.inebriety > 0 && !absorbed.has(item_id)) {
      overdrink(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
    if (item.fullness > 0 && !absorbed.has(item_id)) {
      if (have($item`Special Seasoning`))
        putCloset(itemAmount($item`Special Seasoning`), $item`Special Seasoning`);
      eat(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
  }
  set("_loop_gyou_absorbed_consumables", absorbed_list);
}

function getExtros(): void {
  // Mafia doesn't always notice the workshed
  if (!get("_loopgyou_checkworkshed", false)) {
    const workshed = visitUrl("campground.php?action=workshed");
    if (
      workshed.includes("Cold Medicine Cabinet") &&
      getWorkshed() !== $item`cold medicine cabinet`
    ) {
      throw `Mafia is not detecting your cold medicine cabinet; consider visiting manually`;
    }
    set("_loopgyou_checkworkshed", true);
  }

  if (get("_coldMedicineConsults") >= 5) return;
  if (get("_nextColdMedicineConsult") > totalTurnsPlayed()) return;
  if (getWorkshed() !== $item`cold medicine cabinet`) return;

  const options = visitUrl("campground.php?action=workshed");
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    const item = descToItem(match[1]);
    if (item === $item`Extrovermectin™`) {
      visitUrl("campground.php?action=workshed");
      runChoice(5);
      return;
    }
  }
}

function resetBadOrb(): boolean {
  if (!have($item`bitchin' meatcar`) && !have($item`Desert Bus pass`)) return false;

  // If we just adventured without the orb, visiting the shore will reset the prediction
  const store = visitUrl(toUrl($location`The Shore, Inc. Travel Agency`));
  if (!store.includes("Check out the gift shop")) {
    print("Unable to stare longingly at toast");
    return false;
  }
  runChoice(4);
  return true;
}

export function customRestoreMp(target: number) {
  if (myMp() >= target) return;
  if (get("sweat", 0) >= 80) {
    // Use visit URL to avoid needing to equip the pants
    visitUrl("runskillz.php?action=Skillz&whichskill=7420&targetplayer=0&pwd&quantity=1");
  }
  restoreMp(target);
}

function ensureRecovery(property: string, items: string[], avoid: string[]): string {
  const recovery_property = get(property).split(";");
  for (const item of items) {
    if (!recovery_property.includes(item)) {
      recovery_property.push(item);
    }
  }
  return recovery_property.filter((v) => !avoid.includes(v)).join(";");
}
