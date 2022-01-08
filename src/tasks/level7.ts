import { myLevel, use, visitUrl } from "kolmafia";
import { $item, $location, $monster, $monsters, get, have } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: ["Start"],
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    modifier: "init 850max",
    choices: { 153: 4 },
    combat: new CombatStrategy().kill(...$monsters`modern zmobie, conjoined zmombie`),
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
    completed: () => get("cyrptCrannyEvilness") <= 25,
    do: $location`The Defiled Cranny`,
    modifier: "-combat -25min, ML",
    choices: { 523: 4 },
    combat: new CombatStrategy().killHard(
      ...$monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps, huge ghuol`
    ),
    cap: 25,
  },
  {
    name: "Cranny Boss",
    after: ["Cranny"],
    completed: () => get("cyrptCrannyEvilness") === 0,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    completed: () => get("cyrptNicheEvilness") <= 25,
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    combat: new CombatStrategy().kill().banish(...$monsters`basic lihc, senile lihc, slick lihc`),
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
    ready: () => !have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    modifier: "item 400max",
    choices: { 155: 5 },
    combat: new CombatStrategy().kill().banish($monster`party skelteon`),
    cap: 25,
  },
  {
    name: "Nook Eye",
    after: ["Start"],
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: () => use($item`evil eye`),
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
    },
    ...Alcove,
    ...Cranny,
    ...Niche,
    ...Nook,
    {
      name: "Bonerdagon",
      after: ["Alcove Boss", "Cranny Boss", "Niche Boss", "Nook Boss"],
      completed: () => step("questL07Cyrptic") === 999,
      do: $location`Haert of the Cyrpt`,
      choices: { 527: 1 },
      combat: new CombatStrategy().kill(),
      cap: 1,
    },
  ],
};
