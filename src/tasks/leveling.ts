import { cliExecute, myPrimestat, totalFreeRests, visitUrl } from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  ChateauMantegna,
  get,
  getKramcoWandererChance,
  have,
  Macro,
} from "libram";
import { CombatStrategy, Quest } from "./structure";

export const LevelingQuest: Quest = {
  name: "Leveling",
  tasks: [
    {
      name: "Daycare",
      ready: () => get("daycareOpen"),
      completed: () => get("_daycareGymScavenges") !== 0,
      do: () => visitUrl("choice.php?whichchoice=1336&option=2"),
    },
    {
      name: "Bastille",
      ready: () => have($item`Bastille Battalion control rig`),
      completed: () => get("_bastilleGames") !== 0,
      do: () =>
        cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? "myst" : myPrimestat()}`),
    },
    {
      name: "Chateau",
      ready: () => ChateauMantegna.have(),
      completed: () => get("timesRested") < totalFreeRests(),
      prepare: (): void => {
        let nightstand = null;
        if (myPrimestat() === $stat`Muscle`) {
          nightstand = $item`electric muscle stimulator`;
        } else if (myPrimestat() === $stat`Mysticality`) {
          nightstand = $item`foreign language tapes`;
        } else if (myPrimestat() === $stat`Moxie`) {
          nightstand = $item`bowl of potpourri`;
        }
        if (nightstand !== null && nightstand !== ChateauMantegna.getNightstand()) {
          ChateauMantegna.changeNightstand(nightstand);
        }
      },
      do: () => visitUrl("place.php?whichplace=chateau&action=chateau_restbox"),
    },
    {
      name: "LOV Tunnel",
      ready: () => get("loveTunnelAvailable"),
      completed: () => get("_loveTunnelUsed"),
      do: $location`The Tunnel of L.O.V.E.`,
      choices: { 1222: 1, 1223: 1, 1224: 1, 1225: 1, 1226: 2, 1227: 1, 1228: 3 }, // TODO: Set 1224 to mainstat
      combat: new CombatStrategy().kill(),
    },
    {
      name: "God Lobster",
      ready: () => have($familiar`God Lobster`),
      completed: () => get("_godLobsterFights") >= 3,
      do: () => visitUrl("main.php?fightgodlobster=1"), // TODO: handle fight
      choices: { 1310: 3 },
      combat: new CombatStrategy().kill(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`God Lobster`,
    },
    {
      name: "Sausage Fights",
      ready: () =>
        have($familiar`Pocket Professor`) &&
        have($item`Kramco Sausage-o-Matic™`) &&
        getKramcoWandererChance() === 1,
      completed: () => get("_sausageFights") > 0,
      do: $location`The Outskirts of Cobb's Knob`,
      combat: new CombatStrategy()
        .macro(new Macro().trySkill($skill`lecture on relativity`), $monster`sausage goblin`)
        .abort(), // error on everything except sausage goblin
      modifier: "mainstat, 4exp",
      equip: $items`Kramco Sausage-o-Matic™, makeshift garbage shirt, Pocket Professor memory chip`,
      familiar: $familiar`Pocket Professor`,
    },
    {
      name: "Neverending Party",
      completed: () => get("_neverendingPartyFreeTurns") === 0,
      do: $location`The Neverending Party`,
      choices: { 1322: 2, 1324: 5 },
      combat: new CombatStrategy().kill(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Galloping Grill`,
    },
    {
      name: "Machine Elf",
      ready: () => have($familiar`Machine Elf`),
      completed: () => get("_machineTunnelsAdv") >= 5,
      do: $location`The Deep Machine Tunnels`,
      combat: new CombatStrategy().kill(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Machine Elf`,
    },
  ],
};
