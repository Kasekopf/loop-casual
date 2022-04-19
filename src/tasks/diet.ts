import {
  cliExecute,
  eat,
  myAdventures,
  myDaycount,
  myFullness,
  myInebriety,
  myLevel,
  mySpleenUse,
  reverseNumberology,
  use,
} from "kolmafia";
import { $item, get, have, set } from "libram";
import { args } from "../main";
import { diet } from "../diet";
import { Quest } from "./structure";
export const DietQuest: Quest = {
  name: "Diet",
  tasks: [
    {
      name: "Consume",
      after: [],
      completed: () => myDaycount() > 1 || myFullness() >= 5 || myInebriety() >= 10,
      ready: () => myLevel() >= 13 || myAdventures() === 1,
      do: (): void => {
        if (have($item`astral six-pack`)) {
          use($item`astral six-pack`);
        }
        const food = Math.max(5 - myFullness(), 0);
        const booze = Math.max(10 - myInebriety(), 0);
        const spleen = Math.max(5 - mySpleenUse(), 0);
        diet({ food, booze, spleen });
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Numberology",
      after: [],
      completed: () => get("_universeCalculated") >= get("skillLevel144"),
      ready: () => myAdventures() > 0 && Object.keys(reverseNumberology()).includes("69"),
      do: (): void => {
        cliExecute("numberology 69");
      },
      limit: { tries: 4 },
      freeaction: true,
    },
    {
      name: "Sausage",
      after: ["Consume"],
      completed: () => !have($item`Kramco Sausage-o-Matic™`) || get("_sausagesEaten") >= 23, // Cap at 23 sausages to avoid burning through an entire supply
      ready: () => have($item`magical sausage casing`),
      do: (): void => {
        eat(1, $item`magical sausage`);
      },
      limit: { tries: 23 },
      freeaction: true,
    },
    {
      name: "Hourglass",
      after: [],
      completed: () => !have($item`etched hourglass`) || get("_etchedHourglassUsed"),
      do: (): void => {
        use($item`etched hourglass`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
