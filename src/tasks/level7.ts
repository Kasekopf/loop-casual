import {
  adv1,
  changeMcd,
  cliExecute,
  currentMcd,
  Item,
  myBasestat,
  myTurncount,
  toUrl,
  visitUrl,
} from "kolmafia";
import {
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $stat,
  AutumnAton,
  FloristFriar,
  get,
  have,
  Macro,
} from "libram";
import { Priority, Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { CombatStrategy } from "../engine/combat";
import { atLevel, haveFlorest } from "../lib";
import { Priorities } from "../engine/priority";
import { councilSafe } from "./level12";
import { globalStateCache } from "../engine/state";

function tuneCape(): void {
  if (
    have($item`unwrapped knock-off retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "vampire" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape vampire kill");
  }
}

function tryCape(sword: Item, ...rest: Item[]) {
  if (have($item`unwrapped knock-off retro superhero cape`)) {
    rest.unshift($item`unwrapped knock-off retro superhero cape`);
    rest.unshift(sword);
  }
  return rest;
}

const slay_macro = new Macro().trySkill($skill`Slay the Dead`);

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: ["Start"],
    prepare: tuneCape,
    ready: () =>
      // Reprocess the grave rober, then wait for the +init skill
      (have($skill`Overclocking`) || !!(get("twinPeakProgress") & 8)) &&
      myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptAlcoveEvilness") <= 13,
    do: $location`The Defiled Alcove`,
    post: () => {
      if (haveFlorest() && FloristFriar.ShuffleTruffle.available()) {
        FloristFriar.ShuffleTruffle.plant();
      }
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`antique machete`, $item`gravy boat`),
        modifier: "init 850max",
      };
    },
    // Modern zmobie does not show up in orb
    orbtargets: () => [],
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro).kill(),
    limit: { turns: 37 },
  },
  {
    name: "Alcove Boss",
    after: ["Start", "Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    ready: () => myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptCrannyEvilness") <= 13,
    prepare: () => {
      tuneCape();
      changeMcd(10);
    },
    post: () => {
      if (currentMcd() > 0) changeMcd(0);
      if (haveFlorest() && FloristFriar.BlusteryPuffball.available()) {
        FloristFriar.BlusteryPuffball.plant();
      }
    },
    do: $location`The Defiled Cranny`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape(
          $item`antique machete`,
          $item`gravy boat`,
          $item`old patched suit-pants`,
          $item`unbreakable umbrella`
        ),
        modifier: "-combat, ML",
        modes: { umbrella: "cocoon" },
      };
    },
    choices: { 523: 4 },
    combat: new CombatStrategy()
      .macro(slay_macro)
      .kill(
        $monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps, huge ghuol`
      ),
    // Do not search for swarm with orb
    orbtargets: () => [],
    limit: { turns: 37 },
  },
  {
    name: "Cranny Boss",
    after: ["Start", "Cranny"],
    completed: () => get("cyrptCrannyEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    prepare: tuneCape,
    ready: () => myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptNicheEvilness") <= 13,
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    outfit: (): OutfitSpec => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return {
          equip: $items`gravy boat, industrial fire extinguisher`,
        };
      else
        return {
          equip: tryCape($item`antique machete`, $item`gravy boat`),
        };
    },
    combat: new CombatStrategy()
      .macro(slay_macro, $monster`dirty old lihc`)
      .kill($monster`dirty old lihc`)
      .macro(
        // Don't use the fire extinguisher if we want to absorb the lihc
        () =>
          new Macro().externalIf(
            !globalStateCache.absorb().isTarget($monster`basic lihc`),
            new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`)
          ),
        $monster`basic lihc`
      )
      .macro(
        new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`).step(slay_macro),
        $monsters`senile lihc, slick lihc`
      )
      .banish($monsters`basic lihc, senile lihc, slick lihc`),
    orbtargets: () => [$monster`dirty old lihc`],
    limit: { turns: 37 },
  },
  {
    name: "Niche Boss",
    after: ["Start", "Niche"],
    completed: () => get("cyrptNicheEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    prepare: tuneCape,
    priority: (): Priority => {
      if (AutumnAton.have()) {
        if ($location`The Defiled Nook`.turnsSpent === 0) return Priorities.GoodAutumnaton;
      }
      return Priorities.None;
    },
    ready: () => myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptNookEvilness") <= 13,
    do: $location`The Defiled Nook`,
    post: () => {
      if (haveFlorest() && FloristFriar.HornOfPlenty.available()) {
        FloristFriar.HornOfPlenty.plant();
      }
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`antique machete`, $item`gravy boat`),
        modifier: "item 500max",
      };
    },
    choices: { 155: 5, 1429: 1 },
    orbtargets: () => {
      if (globalStateCache.absorb().isReprocessTarget($monster`party skelteon`))
        return $monsters`party skelteon`;
      if (AutumnAton.have() && myTurncount() < 400) return []; // ignore orb early on
      else return $monsters`spiny skelelton, toothy sklelton`;
    },
    combat: new CombatStrategy()
      .macro(slay_macro, $monsters`spiny skelelton, toothy sklelton`)
      .kill($monsters`spiny skelelton, toothy sklelton`)
      .banish($monster`party skelteon`),
    limit: {
      soft: 37,
    },
  },
  {
    name: "Nook Eye", // In case we get eyes from outside sources (Nostalgia)
    after: ["Start"],
    priority: () => Priorities.Free,
    ready: () =>
      have($item`evil eye`) &&
      !globalStateCache.absorb().isReprocessTarget($monster`party skelteon`),
    completed: () => get("cyrptNookEvilness") <= 13,
    do: (): void => {
      cliExecute("use * evil eye");
    },
    freeaction: true,
    limit: { tries: 13, unready: true },
  },
  {
    name: "Nook Boss",
    after: ["Start", "Nook", "Nook Eye"],
    completed: () => get("cyrptNookEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy().killHard(),
    boss: true,
    limit: { tries: 2 }, // Possible dog adventure
  },
];

export const CryptQuest: Quest = {
  name: "Crypt",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(7),
      completed: () => step("questL07Cyrptic") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    ...Alcove,
    ...Cranny,
    ...Niche,
    ...Nook,
    {
      name: "Bonerdagon",
      after: ["Start", "Alcove Boss", "Cranny Boss", "Niche Boss", "Nook Boss"],
      completed: () => step("questL07Cyrptic") >= 1,
      do: () => {
        adv1($location`Haert of the Cyrpt`, -1, "");
        if (get("lastEncounter") !== "The Bonerdagon")
          visitUrl(toUrl($location`The Defiled Cranny`));
      },
      choices: { 527: 1 },
      combat: new CombatStrategy().killHard(),
      boss: true,
      limit: { tries: 2 },
    },
    {
      name: "Finish",
      after: ["Start", "Bonerdagon"],
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
