import { equip, equippedAmount, equippedItem, toSlot, useFamiliar, weaponHands } from "kolmafia";
import { $familiar, $item, $skill, $slot, $slots, getKramcoWandererChance, have } from "libram";
import { BuiltCombatStrategy } from "./combat";
import { Task } from "./tasks/structure";

// Adapted from phccs
export class Outfit {
  equips: Map<Slot, Item> = new Map<Slot, Item>();
  accesories: Item[] = [];
  familiar?: Familiar;

  equip(item: Item | Familiar): boolean {
    if (!have(item)) return false;

    if (item instanceof Item) {
      const slot = toSlot(item);
      if (slot === $slot`acc1`) {
        if (this.accesories.length >= 3) return false;
        this.accesories.push(item);
        return true;
      }
      if (!this.equips.has(slot)) {
        this.equips.set(slot, item);
        return true;
      }
      if (
        slot === $slot`weapon` &&
        !this.equips.has($slot`off-hand`) &&
        have($skill`Double-Fisted Skull Smashing`) &&
        weaponHands(item)
      ) {
        this.equips.set($slot`off-hand`, item);
        return true;
      }
      return false;
    } else {
      if (this.familiar) return false;
      this.familiar = item;
      return true;
    }
  }

  dress(): void {
    if (this.familiar) useFamiliar(this.familiar);
    const targetEquipment = Array.from(this.equips.values());
    const accessorySlots = $slots`acc1, acc2, acc3`;
    for (const slot of $slots`weapon, off-hand, hat, shirt, pants, familiar, buddy-bjorn, crown-of-thrones, back`) {
      if (
        targetEquipment.includes(equippedItem(slot)) &&
        this.equips.get(slot) !== equippedItem(slot)
      )
        equip(slot, $item`none`);
    }

    //Order is anchored here to prevent DFSS shenanigans
    for (const slot of $slots`weapon, off-hand, hat, back, shirt, pants, familiar, buddy-bjorn, crown-of-thrones`) {
      const equipment = this.equips.get(slot);
      if (equipment) equip(slot, equipment);
    }

    //We don't care what order accessories are equipped in, just that they're equipped
    const accessoryEquips = this.accesories;
    for (const slot of accessorySlots) {
      const toEquip = accessoryEquips.find(
        (equip) =>
          equippedAmount(equip) < accessoryEquips.filter((accessory) => accessory === equip).length
      );
      if (!toEquip) break;
      const currentEquip = equippedItem(slot);
      //We never want an empty accessory slot
      if (
        currentEquip === $item`none` ||
        equippedAmount(currentEquip) >
          accessoryEquips.filter((accessory) => accessory === currentEquip).length
      ) {
        equip(slot, toEquip);
      }
    }
  }

  static create(task: Task, combat: BuiltCombatStrategy): Outfit {
    const outfit = new Outfit();
    if (task.equip) for (const item of task.equip) outfit.equip(item);
    if (task.familiar) outfit.equip(task.familiar);

    for (const item of combat.equip) outfit.equip(item);

    if (combat.can_run_away) {
      outfit.equip($item`Greatest American Pants`) ||
        outfit.equip($item`navel ring of navel gazing`);
    }
    if (getKramcoWandererChance() === 1) {
      outfit.equip($item`Kramco Sausage-o-Matic™`);
    }
    // eslint-disable-next-line libram/verify-constants
    outfit.equip($item`carnivorous potted plant`);
    outfit.equip($item`mafia thumb ring`);
    outfit.equip($item`lucky gold ring`);
    if (task.modifier) {
      // Run maximizer
      if (task.modifier.includes("-combat")) outfit.equip($familiar`Disgeist`);
      if (task.modifier.includes("item")) outfit.equip($familiar`Jumpsuited Hound Dog`);
      if (task.modifier.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);
      if (task.modifier.includes("res")) outfit.equip($familiar`Exotic Parrot`);
      if (task.modifier.includes("init")) outfit.equip($familiar`Oily Woim`);
      // TODO: run maximizer
    } else {
      // Default outfit
      outfit.equip($item`Fourth of May Cosplay Saber`);
      outfit.equip($item`vampyric cloake`);
      outfit.equip($item`Mr. Cheeng's spectacles`);
    }

    return outfit;
  }
}
