import {
  cliExecute,
  equip,
  equippedAmount,
  equippedItem,
  Familiar,
  Item,
  myBasestat,
  Slot,
  toSlot,
  totalTurnsPlayed,
  useFamiliar,
  weaponHands,
} from "kolmafia";
import { $familiar, $item, $skill, $slot, $slots, $stat, get, have, Requirement } from "libram";
import { Task } from "./tasks/structure";
import { canChargeVoid, Resource } from "./resources";

// Adapted from phccs
export class Outfit {
  equips: Map<Slot, Item> = new Map<Slot, Item>();
  accesories: Item[] = [];
  skipDefaults = false;
  familiar?: Familiar;
  modifier?: string;
  avoid?: Item[];

  equip(item?: Item | Familiar | (Item | Familiar)[]): boolean {
    if (item === undefined) return true;
    if (Array.isArray(item)) return item.every((val) => this.equip(val));
    if (!have(item)) return false;
    if (this.avoid && this.avoid.find((i) => i === item) !== undefined) return false;

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
      if (
        slot === $slot`off-hand` &&
        have($familiar`Left-Hand Man`) &&
        this.familiar === undefined &&
        !this.equips.has($slot`familiar`)
      ) {
        if (item === $item`cursed magnifying glass` && !canChargeVoid()) {
          // Cursed magnifying glass cannot trigger in Lefty
          this.equips.set($slot`familiar`, this.equips.get($slot`off-hand`) ?? $item`none`);
          this.equips.set($slot`off-hand`, item);
        } else {
          this.familiar = $familiar`Left-Hand Man`;
          this.equips.set($slot`familiar`, item);
        }
        return true;
      }
      return false;
    } else {
      if (this.familiar) return false;
      if (!have(item)) return false;
      this.familiar = item;
      return true;
    }
  }

  equipFirst<T extends Resource>(resources: T[]): T | undefined {
    for (const resource of resources) {
      if (!resource.available()) continue;
      if (resource.chance && resource.chance() === 0) continue;
      if (!this.canEquip(resource.equip)) continue;
      if (!this.equip(resource.equip)) continue;
      return resource;
    }
    return undefined;
  }

  equipUntilCapped<T extends Resource>(resources: T[]): T[] {
    const result: T[] = [];
    for (const resource of resources) {
      if (!resource.available()) continue;
      if (resource.chance && resource.chance() === 0) continue;
      if (!this.canEquip(resource.equip)) continue;
      if (!this.equip(resource.equip)) continue;
      result.push(resource);
      if (resource.chance && resource.chance() === 1) break;
    }
    return result;
  }

  canEquip(item?: Item | Familiar | (Item | Familiar)[]): boolean {
    if (item === undefined) return true;
    if (Array.isArray(item)) return item.every((val) => this.canEquip(val)); // TODO: smarter
    if (!have(item)) return false;
    if (this.avoid && this.avoid.find((i) => i === item) !== undefined) return false;

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
      if (
        slot === $slot`off-hand` &&
        have($familiar`Left-Hand Man`) &&
        this.familiar === undefined &&
        !this.equips.has($slot`familiar`)
      ) {
        return true;
      }
      return false;
    } else {
      if (this.familiar) return false;
      if (!have(item)) return false;
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

    for (const item of this.avoid ?? []) {
      if (equippedAmount(item) > 0) cliExecute(`unequip ${item.name}`);
    }

    for (const item of this.avoid ?? []) {
      if (equippedAmount(item) > 0) cliExecute(`unequip ${item.name}`);
    }

    if (this.modifier) {
      // Handle familiar equipment manually to avoid weird Left-Hand Man behavior
      const fam_equip = this.equips.get($slot`familiar`);
      if (fam_equip !== undefined) {
        const index = targetEquipment.indexOf(fam_equip);
        if (index > -1) targetEquipment.splice(index, 1);
      }

      let requirements = Requirement.merge([
        new Requirement([this.modifier], {
          forceEquip: targetEquipment.concat(...accessoryEquips),
        }),
      ]);

      if (fam_equip !== undefined) {
        requirements = Requirement.merge([
          requirements,
          new Requirement([], { preventSlot: [$slot`familiar`] }),
        ]);
      }

      if (this.avoid !== undefined) {
        requirements = Requirement.merge([
          requirements,
          new Requirement([], { preventEquip: this.avoid }),
        ]);
      }

      if (!requirements.maximize()) {
        throw `Unable to maximize ${this.modifier}`;
      }
    }
  }

  static create(task: Task): Outfit {
    const spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;

    const outfit = new Outfit();
    for (const item of spec?.equip ?? []) outfit.equip(item);
    if (spec?.familiar) outfit.equip(spec.familiar);
    outfit.avoid = spec?.avoid;

    if (spec?.modifier) {
      // Run maximizer
      if (spec.modifier.includes("item")) {
        if (
          outfit.canEquip($item`li'l ninja costume`) &&
          outfit.canEquip($familiar`Trick-or-Treating Tot`)
        ) {
          outfit.equip($item`li'l ninja costume`);
          outfit.equip($familiar`Trick-or-Treating Tot`);
        } else {
          outfit.equip($familiar`Jumpsuited Hound Dog`);
        }
      }
      if (spec.modifier.includes("meat")) outfit.equip($familiar`Hobo Monkey`);
      if (spec.modifier.includes("init")) outfit.equip($familiar`Oily Woim`);
      outfit.modifier = spec.modifier;
    }
    outfit.skipDefaults = spec?.skipDefaults ?? false;

    return outfit;
  }

  public equipDefaults(): void {
    if (myBasestat($stat`muscle`) >= 40) this.equip($item`mafia thumb ring`);
    this.equip($item`lucky gold ring`);

    // low priority familiars for combat frequency
    if (this.modifier?.includes("-combat")) this.equip($familiar`Disgeist`);
    if (this.modifier?.includes("+combat")) this.equip($familiar`Jumpsuited Hound Dog`);

    if (!this.modifier) {
      // Default outfit
      this.equip($item`Fourth of May Cosplay Saber`);
      if (
        totalTurnsPlayed() >= get("nextParanormalActivity") &&
        get("questPAGhost") === "unstarted"
      )
        this.equip($item`protonic accelerator pack`);
      this.equip($item`vampyric cloake`);
      if (myBasestat($stat`mysticality`) >= 25) this.equip($item`Mr. Cheeng's spectacles`);
    }

    if (get("camelSpit") < 100 && get("cyrptNookEvilness") > 25) {
      this.equip($familiar`Melodramedary`);
    } else if (have($familiar`Temporal Riftlet`)) {
      this.equip($familiar`Temporal Riftlet`);
    } else if (have($item`gnomish housemaid's kgnee`)) {
      this.equip($familiar`Reagnimated Gnome`);
    } else this.equip($familiar`Galloping Grill`);

    const commonFamiliarEquips = new Map<Familiar, Item>([
      [$familiar`Melodramedary`, $item`dromedary drinking helmet`],
      [$familiar`Reagnimated Gnome`, $item`gnomish housemaid's kgnee`],
    ]);
    const familiarEquip = commonFamiliarEquips.get(this.familiar ?? $familiar`none`);
    if (familiarEquip && this.canEquip(familiarEquip)) this.equip(familiarEquip);
  }
}
