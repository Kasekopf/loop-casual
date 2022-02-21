import { cliExecute, Item, myLevel, visitUrl } from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  get,
  have,
  Macro,
} from "libram";
import { OutfitSpec, Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

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
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`costume sword`),
        modifier: "init 850max, sword",
      };
    },
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro, ...$monsters`modern zmobie, conjoined zmombie`),
    limit: { turns: 25 },
  },
  {
    name: "Alcove Boss",
    after: ["Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    prepare: tuneCape,
    completed: () => get("cyrptCrannyEvilness") <= 25,
    do: $location`The Defiled Cranny`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`serpentine sword`),
        modifier: "-combat, ML, sword",
      };
    },
    choices: { 523: 4 },
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .trySkill($skill`Slay the Dead`)
          .skill($skill`Saucegeyser`)
          .repeat(),
        ...$monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps, huge ghuol`
      )
      .macro(slay_macro),
    limit: { turns: 25 },
  },
  {
    name: "Cranny Boss",
    after: ["Cranny"],
    completed: () => get("cyrptCrannyEvilness") === 0,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy(true).killHard(),
    limit: { tries: 1 },
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    prepare: tuneCape,
    completed: () => get("cyrptNicheEvilness") <= 25,
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    outfit: (): OutfitSpec => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return { equip: $items`industrial fire extinguisher` };
      else
        return {
          equip: tryCape($item`serpentine sword`),
        };
    },
    combat: new CombatStrategy()
      .macro(new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`).step(slay_macro))
      .banish(...$monsters`basic lihc, senile lihc, slick lihc`),
    limit: { turns: 25 },
  },
  {
    name: "Niche Boss",
    after: ["Niche"],
    completed: () => get("cyrptNicheEvilness") === 0,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    prepare: tuneCape,
    ready: () => get("camelSpit") >= 100,
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    post: (): void => {
      while (have($item`evil eye`) && get("cyrptNookEvilness") > 25) cliExecute("use * evil eye");
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`costume sword`),
        modifier: "item 500max",
        familiar: $familiar`Melodramedary`,
      };
    },
    choices: { 155: 5, 1429: 1 },
    combat: new CombatStrategy()
      .macro(slay_macro, ...$monsters`spiny skelelton, toothy sklelton`)
      .banish($monster`party skelteon`),
    limit: { tries: 3 },
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
    after: ["Nook", "Nook Eye"],
    completed: () => get("cyrptNookEvilness") === 0,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

export const CryptQuest: Quest = {
  name: "Crypt",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 7,
      completed: () => step("questL07Cyrptic") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Alcove,
    ...Cranny,
    ...Niche,
    ...Nook,
    {
      name: "Bonerdagon",
      after: ["Alcove Boss", "Cranny Boss", "Niche Boss", "Nook Boss"],
      completed: () => step("questL07Cyrptic") >= 1,
      do: $location`Haert of the Cyrpt`,
      choices: { 527: 1 },
      combat: new CombatStrategy(true).kill(),
      limit: { tries: 1 },
    },
    {
      name: "Finish",
      after: ["Bonerdagon"],
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
