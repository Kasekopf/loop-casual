import {
  cliExecute,
  myAdventures,
  myDaycount,
  myFullness,
  myInebriety,
  myLevel,
  mySpleenUse,
  reverseNumberology,
} from "kolmafia";
import { get, set } from "libram";
import { Quest } from "./structure";

function max(a: number, b: number) {
  return a > b ? a : b;
}
export const DietQuest: Quest = {
  name: "Diet",
  tasks: [
    {
      name: "Consume",
      after: [],
      completed: () => myDaycount() > 1 || myFullness() >= 5 || myInebriety() >= 10,
      ready: () => myLevel() >= 13 || myAdventures() === 1,
      do: (): void => {
        // Save cleaners for aftercore
        const spice = get("spiceMelangeUsed");
        const mojo = get("currentMojoFilters");
        set("spiceMelangeUsed", true);
        set("currentMojoFilters", 3);
        const food = max(5 - myFullness(), 0);
        const drink = max(10 - myInebriety(), 0);
        const spleen = max(5 - mySpleenUse(), 0);
        cliExecute(`CONSUME ORGANS ${food} ${drink} ${spleen} NOMEAT`);
        set("spiceMelangeUsed", spice);
        set("currentMojoFilters", mojo);
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
  ],
};
