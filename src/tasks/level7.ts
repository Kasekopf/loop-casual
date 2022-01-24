import { cliExecute, myLevel, use, visitUrl } from "kolmafia";
import {
  $effects,
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
import { Quest, step, Task } from "./structure";
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
  return (): Item[] => {
    if (have($item`unwrapped knock-off retro superhero cape`)) {
      rest.push($item`unwrapped knock-off retro superhero cape`);
      rest.push(sword);
    }
    return rest;
  };
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
    acquire: [{ item: $item`gravy boat` }],
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    equip: tryCape($item`costume sword`, $item`gravy boat`),
    modifier: "init 850max, sword",
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro, ...$monsters`modern zmobie, conjoined zmombie`),
    cap: 25,
  },
  {
    name: "Alcove Boss",
    after: ["Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    completed: () => get("cyrptCrannyEvilness") <= 25,
    do: $location`The Defiled Cranny`,
    equip: tryCape($item`serpentine sword`, $item`fish hatchet`, $item`gravy boat`),
    modifier: "-combat, ML, sword",
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
    cap: 25,
  },
  {
    name: "Cranny Boss",
    after: ["Cranny"],
    completed: () => get("cyrptCrannyEvilness") === 0,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy().killHard(),
    cap: 1,
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    completed: () => get("cyrptNicheEvilness") <= 25,
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    equip: (): Item[] => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return $items`industrial fire extinguisher, gravy boat`;
      else return tryCape($item`serpentine sword`, $item`gravy boat`)();
    },
    combat: (): CombatStrategy => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return new CombatStrategy().macro(
          new Macro().skill($skill`Fire Extinguisher: Zone Specific`)
        );
      else
        return new CombatStrategy()
          .macro(slay_macro)
          .banish(...$monsters`basic lihc, senile lihc, slick lihc`);
    },
    cap: 25,
  },
  {
    name: "Niche Boss",
    after: ["Niche"],
    completed: () => get("cyrptNicheEvilness") === 0,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    ready: () => !have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    equip: tryCape($item`costume sword`, $item`A Light that Never Goes Out`, $item`gravy boat`),
    effects: $effects`Merry Smithsness`,
    modifier: "item 500max, sword",
    choices: { 155: 5, 1429: 1 },
    combat: new CombatStrategy().macro(slay_macro).banish($monster`party skelteon`),
    cap: 25,
  },
  {
    name: "Nook Eye",
    after: ["Start"],
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: () => use($item`evil eye`),
    freeaction: true,
  },
  {
    name: "Nook Boss",
    after: ["Nook"],
    completed: () => get("cyrptNookEvilness") === 0,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy().kill(),
    cap: 1,
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
      cap: 1,
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
      cap: 1,
    },
    {
      name: "Finish",
      after: ["Bonerdagon"],
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      cap: 1,
      freeaction: true,
    },
  ],
};
