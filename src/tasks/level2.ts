import { visitUrl } from "kolmafia";
import { $location } from "libram";
import { atLevel } from "../lib";
import { Quest, step } from "./structure";

export const MosquitoQuest: Quest = {
  name: "Mosquito",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(2),
      completed: () => step("questL02Larva") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Burn Delay",
      after: ["Start"],
      completed: () => $location`The Spooky Forest`.turnsSpent >= 5 || step("questL02Larva") >= 1,
      do: $location`The Spooky Forest`,
      choices: { 502: 2, 505: 1, 334: 1 },
      limit: { tries: 5 },
      delay: 5,
    },
    {
      name: "Mosquito",
      after: ["Burn Delay"],
      completed: () => step("questL02Larva") >= 1,
      do: $location`The Spooky Forest`,
      choices: { 502: 2, 505: 1, 334: 1 },
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
    },
    {
      name: "Finish",
      after: ["Mosquito"],
      completed: () => step("questL02Larva") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
