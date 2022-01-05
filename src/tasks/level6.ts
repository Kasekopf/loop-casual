import { myLevel, visitUrl } from "kolmafia";
import { $item, $location, have } from "libram";
import { Quest, step } from "./structure";

export const FriarQuest: Quest = {
  name: "Friar Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 6,
      completed: () => step("questL06Friar") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Heart",
      after: "Start",
      completed: () => have($item`box of birthday candles`),
      do: $location`The Dark Heart of the Woods`,
      modifier: "-combat",
      cap: 17,
    },
    {
      name: "Neck",
      after: "Start",
      completed: () => have($item`dodecagram`),
      do: $location`The Dark Neck of the Woods`,
      modifier: "-combat",
      cap: 17,
    },
    {
      name: "Elbow",
      after: "Start",
      completed: () => have($item`eldritch butterknife`),
      do: $location`The Dark Elbow of the Woods`,
      modifier: "-combat",
      cap: 17,
    },
    {
      name: "Finish",
      after: ["Heart", "Neck", "Elbow"],
      completed: () => step("questL06Friar") === 999,
      do: () => visitUrl("friars.php?action=ritual&pwd"),
      cap: 1,
    },
  ],
};
