import { use, visitUrl } from "kolmafia";
import { $item, have } from "libram";
import { Priorities } from "../engine/priority";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";

export const TootQuest: Quest = {
  name: "Toot",
  tasks: [
    {
      name: "Start",
      after: [],
      priority: () => Priorities.Free,
      completed: () => step("questM05Toot") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Toot",
      after: ["Start"],
      priority: () => Priorities.Free,
      completed: () => step("questM05Toot") > 0,
      do: () => visitUrl("tutorial.php?action=toot"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Finish",
      after: ["Toot"],
      priority: () => Priorities.Free,
      completed: () => step("questM05Toot") > 0 && !have($item`letter from King Ralph XI`),
      do: () => use($item`letter from King Ralph XI`),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
