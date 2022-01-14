import {
  equip,
  equippedAmount,
  equippedItem,
  myBasestat,
  toSlot,
  useFamiliar,
  weaponHands,
} from "kolmafia";
import { $familiar, $item, $skill, $slot, $slots, $stat, have, Requirement } from "libram";
import { Task } from "./tasks/structure";
import { Resource } from "./resources";

// Adapted from phccs
export class Outfit {
  equips: Map<Slot, Item> = new Map<Slot, Item>();
  accesories: Item[] = [];
  familiar?: Familiar;
  modifier?: string;

  equip(item?: Item | Familiar): boolean {
    if (item === undefined) return true;
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

  equip_first<T extends Resource>(resources: T[]): T | undefined {
    for (const resource of resources) {
      if (!resource.available()) continue;
      if (resource.chance && resource.chance() === 0) continue;
      if (!this.equip(resource.equip)) continue;
      return resource;
    }
    return undefined;
  }

  equip_until_capped<T extends Resource>(resources: T[]): T[] {
    const result: T[] = [];
    for (const resource of resources) {
      if (!resource.available()) continue;
      if (resource.chance && resource.chance() === 0) continue;
      if (!this.equip(resource.equip)) continue;
      result.push(resource);
      if (resource.chance && resource.chance() === 1) break;
    }
    return result;
  }

  can_equip(item?: Item | Familiar): boolean {
    if (item === undefined) return true;
    if (!have(item)) return false;

    if (item instanceof Item) {
      const slot = toSlot(item);
      if (slot === $slot`acc1`) {
        if (this.accesories.length >= 3) return false;
        return true;
      }
      if (!this.equips.has(slot)) {
        return true;
      }
      if (
        slot === $slot`weapon` &&
        !this.equips.has($slot`off-hand`) &&
        have($skill`Double-Fisted Skull Smashing`) &&
        weaponHands(item)
      ) {
        return true;
      }
      return false;
    } else {
      if (this.familiar) return false;
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

    if (this.modifier) {
      const requirements = Requirement.merge([
        new Requirement([this.modifier], {
          forceEquip: targetEquipment.concat(...accessoryEquips),
        }),
      ]);
      if (!requirements.maximize()) {
        throw `Unable to maximize ${this.modifier}`;
      }
    }
  }

  static create(task: Task): Outfit {
    const outfit = new Outfit();
    if (task.equip) for (const item of task.equip) outfit.equip(item);
    if (task.familiar) outfit.equip(task.familiar);

    if (task.modifier) {
      // Run maximizer
      if (task.modifier.includes("-combat")) outfit.equip($familiar`Disgeist`);
      if (task.modifier.includes("item")) outfit.equip($familiar`Jumpsuited Hound Dog`);
      if (task.modifier.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);
      if (task.modifier.includes("meat")) outfit.equip($familiar`Hobo Monkey`);
      if (task.modifier.includes("res")) outfit.equip($familiar`Exotic Parrot`);
      if (task.modifier.includes("init")) outfit.equip($familiar`Oily Woim`);
      outfit.modifier = task.modifier;
    }

    return outfit;
  }

  public equip_defaults(): void {
    if (myBasestat($stat`muscle`) >= 40) this.equip($item`mafia thumb ring`);
    this.equip($item`lucky gold ring`);

    if (!this.modifier) {
      // Default outfit
      this.equip($item`Fourth of May Cosplay Saber`);
      this.equip($item`vampyric cloake`);
      if (myBasestat($stat`mysticality`) >= 25) this.equip($item`Mr. Cheeng's spectacles`);
      this.equip($familiar`Galloping Grill`);
    }
  }
}
