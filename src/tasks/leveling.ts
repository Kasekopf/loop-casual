import { cliExecute, myLevel, myPrimestat, totalFreeRests, visitUrl } from "kolmafia";
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
import { Quest } from "./structure";
import { CombatStrategy } from "../combat";

function primestat_id(): number {
  switch (myPrimestat()) {
    case $stat`Muscle`:
      return 1;
    case $stat`Mysticality`:
      return 2;
    case $stat`Moxie`:
      return 3;
  }
  return 1;
}

export const LevelingQuest: Quest = {
  name: "Leveling",
  tasks: [
    {
      name: "Daycare",
      after: [],
      ready: () => get("daycareOpen"),
      completed: () => get("_daycareGymScavenges") !== 0 || myLevel() >= 13,
      do: () => visitUrl("choice.php?whichchoice=1336&option=2"),
      cap: 1,
    },
    {
      name: "Bastille",
      after: [],
      ready: () => have($item`Bastille Battalion control rig`),
      completed: () => get("_bastilleGames") !== 0 || myLevel() >= 13,
      do: () =>
        cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? "myst" : myPrimestat()}`),
      cap: 1,
    },
    {
      name: "Chateau",
      after: [],
      ready: () => ChateauMantegna.have(),
      completed: () => get("timesRested") >= totalFreeRests() || myLevel() >= 13,
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
      after: [],
      ready: () => get("loveTunnelAvailable"),
      completed: () => get("_loveTunnelUsed") || myLevel() >= 13,
      do: $location`The Tunnel of L.O.V.E.`,
      choices: { 1222: 1, 1223: 1, 1224: primestat_id, 1225: 1, 1226: 2, 1227: 1, 1228: 3 },
      combat: new CombatStrategy().killHard(),
      cap: 1,
    },
    {
      name: "God Lobster",
      after: [],
      ready: () => have($familiar`God Lobster`),
      completed: () => get("_godLobsterFights") >= 3 || myLevel() >= 13,
      do: () => visitUrl("main.php?fightgodlobster=1"),
      choices: { 1310: 3 },
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`God Lobster`,
      cap: 3,
    },
    {
      name: "Sausage Fights",
      after: [],
      ready: () =>
        have($familiar`Pocket Professor`) &&
        have($item`Kramco Sausage-o-Matic™`) &&
        getKramcoWandererChance() === 1,
      completed: () => get("_sausageFights") > 0 || myLevel() >= 13,
      do: $location`The Outskirts of Cobb's Knob`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`lecture on relativity`)
            .trySkill($skill`Saucegeyser`)
            .repeat(),
          $monster`sausage goblin`
        )
        .abort(), // error on everything except sausage goblin
      modifier: "mainstat, 4exp",
      equip: $items`Kramco Sausage-o-Matic™, makeshift garbage shirt, Pocket Professor memory chip`,
      familiar: $familiar`Pocket Professor`,
      cap: 1,
    },
    {
      name: "Neverending Party",
      after: [],
      completed: () => get("_neverendingPartyFreeTurns") >= 10 || myLevel() >= 13,
      do: $location`The Neverending Party`,
      choices: { 1322: 2, 1324: 5 },
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Galloping Grill`,
      cap: 11,
    },
    {
      name: "Machine Elf",
      after: [],
      ready: () => have($familiar`Machine Elf`),
      completed: () => get("_machineTunnelsAdv") >= 5 || myLevel() >= 13,
      do: $location`The Deep Machine Tunnels`,
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Machine Elf`,
      cap: 5,
    },
  ],
};
