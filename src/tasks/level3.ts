import { getProperty, myLevel, runChoice, runCombat, visitUrl } from "kolmafia";
import { $effect, ensureEffect } from "libram";
import { Quest, step } from "./structure";

export const TavernQuest: Quest = {
  name: "Tavern",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 3,
      completed: () => step("questL03Rat") >= 0,
      do: () => visitUrl("council.php"),
      cap: 1,
    },
    {
      name: "Tavernkeep",
      after: ["Start"],
      completed: () => step("questL03Rat") >= 1,
      do: () => visitUrl("tavern.php?place=barkeep"),
      cap: 1,
    },
    {
      name: "Basement",
      after: ["Tavernkeep"],
      completed: () => step("questL03Rat") >= 2,
      prepare: (): void => {
        ensureEffect($effect`Belch the Rainbow™`);
        ensureEffect($effect`Benetton's Medley of Diversity`);
      },
      do: (): void => {
        const layout = getProperty("tavernLayout");
        const path = [3, 2, 1, 0, 5, 10, 15, 20, 16, 21];
        for (let i = 0; i < path.length; i++) {
          if (layout.charAt(path[i]) === "0") {
            visitUrl("cellar.php");
            visitUrl(`cellar.php?action=explore&whichspot=${path[i] + 1}`);
            runCombat();
            runChoice(-1);
            break;
          }
        }
      },
      modifier: "-combat",
      choices: { 509: 1, 510: 1, 511: 2, 514: 2, 515: 2, 496: 2, 513: 2 },
      cap: 10,
    },
    {
      name: "Finish",
      after: ["Basement"],
      completed: () => step("questL03Rat") === 999,
      do: () => visitUrl("tavern.php?place=barkeep"),
      cap: 1,
    },
  ],
};
