import {
  equippedItem,
  Location,
  Monster,
  monsterDefense,
  monsterLevelAdjustment,
  myBuffedstat,
  weaponType,
} from "kolmafia";
import { $item, $skill, $slot, $stat, Macro } from "libram";
import { ActionDefaults, CombatStrategy as BaseCombatStrategy } from "grimoire-kolmafia";

const myActions = [
  "ignore", // Task doesn't care what happens
  "ignoreNoBanish", // Task doesn't care what happens, as long as it is not banished
  "kill", // Task needs to kill it, with or without a free kill
  "killFree", // Task needs to kill it with a free kill
  "killHard", // Task needs to kill it without using a free kill (i.e., boss, or already free)
  "banish", // Task doesn't care what happens, but banishing is useful
  "abort", // Abort the macro and the script; an error has occured
] as const;
export type CombatActions = typeof myActions[number];
export class CombatStrategy extends BaseCombatStrategy.withActions(myActions) {}
export class MyActionDefaults implements ActionDefaults<CombatActions> {
  ignore() {
    return new Macro()
      .runaway()
      .skill($skill`Saucestorm`)
      .attack()
      .repeat();
  }

  kill(target?: Monster | Location) {
    // Upgrade normal kills to hard kills if we are underleveled
    if (
      target &&
      target instanceof Monster &&
      monsterDefense(target) * 1.25 > myBuffedstat(weaponType(equippedItem($slot`Weapon`)))
    )
      return this.killHard();

    if (monsterLevelAdjustment() > 150) return new Macro().skill($skill`Saucegeyser`).repeat();
    if (target && target instanceof Monster && target.physicalResistance >= 70)
      return this.delevel()
        .skill($skill`Saucegeyser`)
        .repeat();
    else return this.delevel().attack().repeat();
  }

  killHard(target?: Monster | Location) {
    if (
      (target && target instanceof Monster && target.physicalResistance >= 70) ||
      weaponType(equippedItem($slot`Weapon`)) !== $stat`muscle`
    ) {
      return this.delevel()
        .skill($skill`Saucegeyser`)
        .repeat();
    } else {
      return this.delevel()
        .skill($skill`Lunging Thrust-Smack`)
        .repeat();
    }
  }

  ignoreNoBanish() {
    return this.ignore();
  }
  killFree() {
    return this.abort();
  } // Abort if no resource provided
  banish() {
    return this.abort();
  } // Abort if no resource provided
  abort() {
    return new Macro().abort();
  }

  private delevel() {
    return new Macro()
      .skill($skill`Curse of Weaksauce`)
      .trySkill($skill`Pocket Crumbs`)
      .trySkill($skill`Micrometeorite`)
      .tryItem($item`Rain-Doh indigo cup`)
      .trySkill($skill`Summon Love Mosquito`)
      .tryItem($item`Time-Spinner`);
  }
}
