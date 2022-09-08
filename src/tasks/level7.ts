import { changeMcd, cliExecute, currentMcd, Item, myBasestat, visitUrl } from "kolmafia";
import {
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $stat,
  get,
  have,
  Macro,
} from "libram";
import { Quest, Task } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { OverridePriority } from "../engine/priority";
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

const slay_macro = new Macro()
  .trySkill($skill`Slay the Dead`)
  .attack()
  .repeat();

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: ["Start"],
    prepare: tuneCape,
    ready: () =>
      // Reprocess the grave rober, then wait for the +init skill
      (globalStateCache.absorb().hasReprocessTargets($location`The Defiled Alcove`) ||
        have($skill`Overclocking`) ||
        !!(get("twinPeakProgress") & 8)) &&
      myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`antique machete`, $item`gravy boat`),
        modifier: "init 850max",
      };
    },
    // Modern zmobie does not show up in orb
    orbtargets: () => [],
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro),
    limit: { turns: 25 },
  },
  {
    name: "Alcove Boss",
    after: ["Start", "Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy().kill(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    ready: () => myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptCrannyEvilness") <= 25,
    prepare: () => {
      tuneCape();
      changeMcd(10);
    },
    post: () => { if (currentMcd() > 0) changeMcd(0); },
    do: $location`The Defiled Cranny`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`antique machete`, $item`gravy boat`, $item`old patched suit-pants`),
        modifier: "-combat, ML",
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
    limit: { turns: 25 },
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
    completed: () => get("cyrptNicheEvilness") <= 25,
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
    limit: { turns: 25 },
  },
  {
    name: "Niche Boss",
    after: ["Start", "Niche"],
    completed: () => get("cyrptNicheEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy().kill(),
    boss: true,
    limit: { tries: 1 },
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    prepare: tuneCape,
    ready: () => myBasestat($stat`Muscle`) >= 62,
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    post: (): void => {
      // Use evil eyes via chat until mafia tracking is fixed
      if (get("cyrptNookEvilness") > 25) cliExecute("/use * evil eye");
      // while (have($item`evil eye`) && get("cyrptNookEvilness") > 25) cliExecute("use * evil eye");
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`antique machete`, $item`gravy boat`),
        modifier: "item 500max",
      };
    },
    choices: { 155: 5, 1429: 1 },
    combat: new CombatStrategy()
      .macro(slay_macro, $monsters`spiny skelelton, toothy sklelton`)
      .banish($monster`party skelteon`),
    limit: { soft: 30 },
  },
  {
    name: "Nook Eye", // In case we get eyes from outside sources (Nostalgia)
    after: ["Start"],
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: (): void => {
      cliExecute("use * evil eye");
    },
    freeaction: true,
    limit: { tries: 9 },
  },
  {
    name: "Nook Boss",
    after: ["Start", "Nook", "Nook Eye"],
    completed: () => get("cyrptNookEvilness") === 0 && step("questL07Cyrptic") !== -1,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy().killItem(),
    boss: true,
    limit: { tries: 1 },
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
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
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
      do: $location`Haert of the Cyrpt`,
      choices: { 527: 1 },
      combat: new CombatStrategy().kill(),
      boss: true,
      limit: { tries: 1 },
    },
    {
      name: "Finish",
      after: ["Start", "Bonerdagon"],
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
