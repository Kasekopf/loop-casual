import { getProperty, numericModifier, runChoice, runCombat, visitUrl } from "kolmafia";
import { $item, $items, $monster, get, have } from "libram";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { Priorities } from "../engine/priority";
import { councilSafe } from "./level12";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";

export const TavernQuest: Quest = {
  name: "Tavern",
  tasks: [
    {
      name: "Start",
      after: ["Mosquito/Finish"],
      ready: () => atLevel(3),
      completed: () => step("questL03Rat") >= 0,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Tavernkeep",
      after: ["Start"],
      completed: () => step("questL03Rat") >= 1,
      do: () => visitUrl("tavern.php?place=barkeep"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Basement",
      after: ["Tavernkeep"],
      completed: () => step("questL03Rat") >= 2,
      priority: () =>
        (atLevel(17) || !have($item`backup camera`)) &&
        (!have($item`June cleaver`) ||
          (get("_juneCleaverStench") >= 20 &&
            get("_juneCleaverSpooky") >= 20 &&
            get("_juneCleaverHot") >= 20 &&
            get("_juneCleaverCold") >= 20))
          ? Priorities.None
          : Priorities.BadGoose, // Wait for backup camera to max out
      do: (): void => {
        visitUrl("cellar.php");
        const layout = getProperty("tavernLayout");
        const path = [3, 2, 1, 0, 5, 10, 15, 20, 16, 21];
        for (let i = 0; i < path.length; i++) {
          if (layout.charAt(path[i]) === "0") {
            visitUrl(`cellar.php?action=explore&whichspot=${path[i] + 1}`);
            runCombat();
            runChoice(-1);
            break;
          }
        }
      },
      outfit: () => {
        if (have($item`June cleaver`))
          return { modifier: "ML, -combat", equip: $items`June cleaver, old patched suit-pants` };
        return { modifier: "ML, +combat", equip: $items`old patched suit-pants` };
      },
      combat: new CombatStrategy().killHard($monster`drunken rat king`).ignoreNoBanish(),
      choices: {
        509: 1,
        510: 1,
        511: 2,
        514: () => (numericModifier("Stench Damage") >= 20 ? 2 : 1),
        515: () => (numericModifier("Spooky Damage") >= 20 ? 2 : 1),
        496: () => (numericModifier("Hot Damage") >= 20 ? 2 : 1),
        513: () => (numericModifier("Cold Damage") >= 20 ? 2 : 1),
      },
      limit: { tries: 10 },
    },
    {
      name: "Finish",
      after: ["Basement"],
      completed: () => step("questL03Rat") === 999,
      do: () => visitUrl("tavern.php?place=barkeep"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
