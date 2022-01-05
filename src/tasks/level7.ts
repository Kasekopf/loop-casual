import { myLevel, use, visitUrl } from "kolmafia";
import { $item, $location, $monster, $monsters, get, have } from "libram";
import { CombatStrategy, Quest, step, Task } from "./structure";

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: "Start",
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    modifier: "init max 850",
    choices: { 153: 4 },
    combat: new CombatStrategy().kill($monster`modern zmobie`),
    cap: 25,
  },
  {
    name: "Alcove Boss",
    after: "Alcove",
    completed: () => get("cyrptAlcoveEvilness") === 0,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: "Start",
    completed: () => get("cyrptCrannyEvilness") <= 25,
    do: $location`The Defiled Cranny`,
    modifier: "-combat, ML",
    choices: { 523: 4 },
    combat: new CombatStrategy().kill(
      ...$monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps`
    ),
    cap: 25,
  },
  {
    name: "Cranny Boss",
    after: "Cranny",
    completed: () => get("cyrptCrannyEvilness") === 0,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: "Start",
    completed: () => get("cyrptNicheEvilness") <= 25,
    do: $location`The Defiled Niche`,
    modifier: "-combat, ML",
    choices: { 157: 4 },
    combat: new CombatStrategy()
      .kill($monster`dirty old lihc`)
      .banish(...$monsters`basic lihc, senile lihc, slick lihc`),
    cap: 25,
  },
  {
    name: "Niche Boss",
    after: "Niche",
    completed: () => get("cyrptNicheEvilness") === 0,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: "Start",
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    modifier: "item max 400",
    choices: { 155: 5 },
    combat: new CombatStrategy()
      .kill(...$monsters`spiny skelelton, toothy sklelton`)
      .banish($monster`party skelteon`),
    cap: 25,
  },
  {
    name: "Nook Eye",
    after: "Start",
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: () => use($item`evil eye`),
  },
  {
    name: "Nook Boss",
    after: "Nook",
    completed: () => get("cyrptNookEvilness") === 0,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy().kill(),
    cap: 1,
  },
];

export const CryptQuest: Quest = {
  name: "Crypt Quest",
  tasks: [
    {
      name: "Start",
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
      do: $location`Haert of the Cyrpt`,
      choices: { 527: 1 },
      combat: new CombatStrategy().kill(),
      cap: 1,
    },
    {
      name: "Finish",
      after: ["Bonerdagon"],
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
  ],
};
