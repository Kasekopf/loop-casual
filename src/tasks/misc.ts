import { cliExecute, myDaycount, myFullness, myInebriety, mySpleenUse } from "kolmafia";
import { $item, have, set } from "libram";
import { Quest } from "./structure";

export const MiscQuest: Quest = {
  name: "Misc",
  tasks: [
    {
      name: "Unlock Beach",
      after: [],
      completed: () => have($item`bitchin' meatcar`) || have($item`Desert Bus pass`),
      do: () => cliExecute("acquire 1 bitchin' meatcar"),
      cap: 1,
    },
    {
      name: "Unlock Island",
      after: [],
      completed: () =>
        have($item`dingy dinghy`) || have($item`junk junk`) || have($item`skeletal skiff`),
      do: () => cliExecute("acquire skeletal skiff"),
      cap: 1,
    },
    {
      name: "Consume",
      after: ["Manor/Billiards"],
      completed: () =>
        myDaycount() > 1 || myFullness() >= 15 || myInebriety() >= 14 || mySpleenUse() >= 15,
      do: (): void => {
        set("spiceMelangeUsed", true);
        set("currentMojoFilters", 3);
        cliExecute("CONSUME ALL NOMEAT");
        set("spiceMelangeUsed", false);
        set("currentMojoFilters", 0);
      },
      cap: 1,
    },
  ],
};
