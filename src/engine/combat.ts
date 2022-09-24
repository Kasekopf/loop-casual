import {
  appearanceRates,
  floor,
  Location,
  Monster,
  myBuffedstat,
  myMp,
  numericModifier,
  Skill,
  Stat,
} from "kolmafia";
import { $skill, $stat, have, Macro } from "libram";
import { ActionDefaults, CombatStrategy as BaseCombatStrategy } from "grimoire-kolmafia";

const myActions = [
  "ignore", // Task doesn't care what happens
  "ignoreSoftBanish", // Do not seek out a banish, but it is advantageous to have it
  "ignoreNoBanish", // Task doesn't care what happens, as long as it is not banished
  "kill", // Task needs to kill it, with or without a free kill
  "killFree", // Task needs to kill it with a free kill
  "killHard", // Task needs to kill it without using a free kill (i.e., boss, or already free)
  "banish", // Task doesn't care what happens, but banishing is useful
  "abort", // Abort the macro and the script; an error has occured
  "killItem", // Kill with an item boost,
  "yellowRay", // Kill with a drop-everything YR action
  "forceItems", // Force items to drop with a YR or saber
] as const;
export type CombatActions = typeof myActions[number];
export class CombatStrategy extends BaseCombatStrategy.withActions(myActions) {}
export class MyActionDefaults implements ActionDefaults<CombatActions> {
  ignore(target?: Monster | Location) {
    return this.kill(target);
  }

  ignoreSoftBanish(target?: Monster | Location) {
    return this.kill(target);
  }

  kill(target?: Monster | Location) {
    return this.killWith(target, $skill`Infinite Loop`, $stat`Moxie`);
  }

  killHard(target?: Monster | Location) {
    return this.kill(target);
  }

  ignoreNoBanish(target?: Monster | Location) {
    return this.kill(target);
  }

  killFree() {
    return this.abort();
  } // Abort if no resource provided

  banish(target?: Monster | Location) {
    return this.kill(target);
  }

  abort() {
    return new Macro().abort();
  }

  killItem(target?: Monster | Location) {
    if (have($skill`Double Nanovision`))
      return this.killWith(target, $skill`Double Nanovision`, $stat`Mysticality`);
    else return this.kill(target);
  }

  yellowRay(target?: Monster | Location) {
    return this.killItem(target);
  }

  forceItems(target?: Monster | Location) {
    return this.killItem(target);
  }

  private killWith(
    target: Monster | Location | undefined,
    killing_blow: Skill,
    killing_stat: Stat
  ): Macro {
    if (
      (target instanceof Monster && target.physicalResistance >= 70) ||
      myMp() < 20 ||
      !have(killing_blow)
    )
      return new Macro().attack().repeat();

    // Weaken monsters with Pseudopod slap until they are in range of our kill.
    // Since monsterhpabove is locked behind manuel/factoids, just do the maximum
    // number of slaps we could ever need for the monster/zone.
    if (myBuffedstat(killing_stat) * floor(myMp() / 20) < 100) {
      const HPgap = maxHP(target) - myBuffedstat(killing_stat) * floor(myMp() / 20);
      const slaps = Math.ceil(HPgap / 10);
      if (slaps > 0) {
        return new Macro()
          .while_(`!times ${slaps}`, new Macro().skill($skill`Pseudopod Slap`))
          .while_("!mpbelow 20", new Macro().skill(killing_blow))
          .attack()
          .repeat();
      }
    }
    return new Macro().while_("!mpbelow 20", new Macro().skill(killing_blow)).attack().repeat();
  }
}

function getMonsters(where?: Location): Monster[] {
  if (where === undefined) return [];
  return Object.entries(appearanceRates(where)) // Get the maximum HP in the location
    .filter((i) => i[1] > 0)
    .map((i) => Monster.get(i[0]));
}

function maxHP(target?: Monster | Location): number {
  if (target === undefined) return 1;
  const base =
    target instanceof Location ? Math.max(...getMonsters(target).map(maxHP)) : target.baseHp;
  return Math.floor(1.05 * base) + numericModifier("Monster Level");
}
