import {
  canEquip,
  cliExecute,
  equip,
  equippedAmount,
  equippedItem,
  Familiar,
  familiarWeight,
  Item,
  itemAmount,
  myBasestat,
  Slot,
  toSlot,
  useFamiliar,
  weaponHands,
} from "kolmafia";
import { $familiar, $item, $skill, $slot, $slots, $stat, get, getKramcoWandererChance, have, Requirement } from "libram";
import { Task } from "./tasks/structure";
import { canChargeVoid, Resource } from "./resources";
import { Keys, keyStrategy } from "./tasks/keys";
import { GameState } from "./state";
import { towerSkip } from "./tasks/level13";

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
    if (!have(item) && item !== $familiar`none`) return false;
    if (item instanceof Item && !canEquip(item)) return false;
    if (this.avoid && this.avoid.find((i) => i === item) !== undefined) return false;

    if (item instanceof Item) {
      const slot = toSlot(item);
      if (slot === $slot`familiar` && this.familiar === $familiar`none`) {
        return false;
      }
      if (slot === $slot`acc1`) {
        if (this.accesories.length >= 3) return false;
        this.accesories.push(item);
        return true;
      }
      if (slot === $slot`off-hand`) {
        const weapon = this.equips.get($slot`weapon`);
        if (weapon && weaponHands(weapon) === 2) return false;
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
      if (this.familiar && this.familiar !== item) return false;
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
    if (!have(item) && item !== $familiar`none`) return false;
    if (item instanceof Item && !canEquip(item)) return false;
    if (this.avoid && this.avoid.find((i) => i === item) !== undefined) return false;

    if (item instanceof Item) {
      const slot = toSlot(item);
      if (slot === $slot`familiar` && this.familiar === $familiar`none`) {
        return false;
      }
      if (slot === $slot`acc1`) {
        if (this.accesories.length >= 3) return false;
        return true;
      }
      if (slot === $slot`off-hand`) {
        const weapon = this.equips.get($slot`weapon`);
        if (weapon && weaponHands(weapon) === 2) return false;
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
      if (this.familiar && this.familiar !== item) return false;
      return true;
    }
  }

  dress(forceUpdate = false): void {
    if (this.familiar !== undefined) useFamiliar(this.familiar);
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
      if (equipment) {
        if (slot === $slot`off-hand` && !this.equips.has($slot`weapon`) && weaponHands(equippedItem($slot`weapon`)) > 1) {
          equip($item`none`, $slot`weapon`); // can't equip an off-hand with a two-handed weapon
        }
        equip(slot, equipment);
        if (equippedItem(slot) !== equipment) throw `Failed to equip ${equipment}`;
      }
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
        if (equippedItem(slot) !== toEquip) throw `Failed to equip ${toEquip}`;
      }
    }

    if (this.modifier) {
      // Handle familiar equipment manually to avoid weird Left-Hand Man behavior
      const fam_equip = this.equips.get($slot`familiar`);
      if (fam_equip !== undefined) {
        const index = targetEquipment.indexOf(fam_equip);
        if (index > -1) targetEquipment.splice(index, 1);
      }

      let requirements = Requirement.merge([
        new Requirement([this.modifier, "0.01 MP regen, 0.001 HP regen"], {
          forceEquip: targetEquipment.concat(...accessoryEquips),
          forceUpdate: forceUpdate,
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

      if (
        have($item`cursed magnifying glass`) &&
        get("cursedMagnifyingGlassCount") >= 13 &&
        !targetEquipment.includes($item`cursed magnifying glass`)
      ) {
        // Avoid burning CMG void fight just for the modifier
        requirements = Requirement.merge([
          requirements,
          new Requirement([], { preventEquip: [$item`cursed magnifying glass`] }),
        ]);
      }

      // Libram outfit cache may not autofold umbrella, so we need to
      if (have($item`unbreakable umbrella`)) {
        if (this.modifier.includes("-combat")) {
          if (get("umbrellaState") !== "cocoon") cliExecute("umbrella cocoon");
        } else if (this.modifier.includes("ML")) {
          if (get("umbrellaState") !== "broken") cliExecute("umbrella broken");
        }
      }

      if (!requirements.maximize()) {
        throw `Unable to maximize ${this.modifier}`;
      }
    }

    // Do not use +ML backup camera unless specifically needed
    // Libram outfit cache may not autofold camera, so we need to
    if (equippedAmount($item`backup camera`) > 0) {
      if ((!this.modifier || !this.modifier.includes("ML")) &&
        get("backupCameraMode").toLowerCase() === "ml"
      ) {
        cliExecute("backupcamera meat");
      }
      if (!get("backupCameraReverserEnabled")) {
        cliExecute("backupcamera reverser on");
      }
    }

    // Libram outfit cache may not autofold cape, so we need to
    if (equippedAmount($item`unwrapped knock-off retro superhero cape`) > 0) {
      if (this.modifier?.includes("res") && (get("retroCapeSuperhero") !== "vampire") || get("retroCapeWashingInstructions") !== "hold") {
        cliExecute("retrocape vampire hold");
      }
    }
  }

  static create(task: Task, state: GameState): Outfit {
    const spec = typeof task.outfit === "function" ? task.outfit(state) : task.outfit;

    const outfit = new Outfit();
    for (const item of spec?.equip ?? []) outfit.equip(item);
    if (spec?.familiar !== undefined) outfit.equip(spec.familiar);
    outfit.avoid = spec?.avoid;

    if (spec?.modifier) {
      // Run maximizer
      if (spec.modifier.includes("item")) {
        outfit.equip($familiar`Grey Goose`);
        if (!spec.modifier.includes("+combat") && !spec.modifier.includes(" combat") && !spec.modifier.includes("res"))
          outfit.equip($item`protonic accelerator pack`);
      }
      // if (spec.modifier.includes("+combat")) outfit.equip($familiar`Jumpsuited Hound Dog`);
      if (spec.modifier.includes("meat")) {
        outfit.equip($familiar`Hobo Monkey`);
        outfit.equip($familiar`Leprechaun`); // backup
      }
      if (spec.modifier.includes("+combat") && !spec.modifier.includes("res"))
        outfit.equip($item`thermal blanket`);
      outfit.modifier = spec.modifier;
    }
    outfit.skipDefaults = spec?.skipDefaults ?? false;

    return outfit;
  }

  public equipCharging(): void {
    if (this.modifier?.includes("-combat")) {
      // Modifier plays strangely with the umbrella
      this.equip($item`unbreakable umbrella`);
    }

    if (familiarWeight($familiar`Grey Goose`) < 6 ||
      (familiarWeight($familiar`Grey Goose`) >= 6 && [...this.equips.values()].includes($item`Kramco Sausage-o-Matic™`) && getKramcoWandererChance() === 1)) {
      if (this.equip($familiar`Grey Goose`)) {
        this.equip($item`yule hatchet`);
        this.equip($item`ghostly reins`);
        this.equip($item`teacher's pen`);
        this.equip($item`familiar scrapbook`);
      }
    } else if (
      (!have($item`eleven-foot pole`) ||
        !have($item`ring of Detect Boring Doors`) ||
        !have($item`Pick-O-Matic lockpicks`)) &&
      keyStrategy.useful(Keys.Dungeon) !== false &&
      !towerSkip()
    ) {
      this.equip($familiar`Gelatinous Cubeling`);
    } else if (get("camelSpit") < 100 && get("zeppelinProtestors") < 80) {
      this.equip($familiar`Melodramedary`);
    }
  }

  public equipDefaults(): void {
    if (this.modifier?.includes("-combat")) this.equip($familiar`Disgeist`); // low priority

    if (have($familiar`Temporal Riftlet`)) {
      this.equip($familiar`Temporal Riftlet`);
    } else if (have($item`gnomish housemaid's kgnee`)) {
      this.equip($familiar`Reagnimated Gnome`);
    } else this.equip($familiar`Galloping Grill`);
    this.equip($familiar`Melodramedary`);

    if (this.familiar === $familiar`Grey Goose` && familiarWeight($familiar`Grey Goose`) < 6)
      this.equip($item`grey down vest`);
    if (this.familiar === $familiar`Melodramedary` && get("camelSpit") < 100)
      this.equip($item`dromedary drinking helmet`);
    if (this.familiar === $familiar`Reagnimated Gnome`)
      this.equip($item`gnomish housemaid's kgnee`);

    if (myBasestat($stat`muscle`) >= 40) this.equip($item`mafia thumb ring`);

    if (!this.modifier) {
      // Default outfit
      if (myBasestat($stat`moxie`) >= 47) this.equip($item`giant yellow hat`);
      this.equip($item`ice crown`);
      this.equip($item`June cleaver`);
      this.equip($item`industrial fire extinguisher`);
      if (have($skill`Torso Awareness`)) this.equip($item`fresh coat of paint`);
      this.equip($item`familiar scrapbook`);
      this.equip($item`protonic accelerator pack`);
      this.equip($item`unwrapped knock-off retro superhero cape`);
      this.equip($item`designer sweatpants`);
      if (myBasestat($stat`moxie`) >= 10) this.equip($item`warbear long johns`);
      if (myBasestat($stat`moxie`) >= 85) this.equip($item`square sponge pants`);
      this.equip($item`Cargo Cultist Shorts`);
      this.equip($item`lucky gold ring`);
      this.equip($item`Powerful Glove`);
      if (
        this.familiar === $familiar`Grey Goose` &&
        familiarWeight($familiar`Grey Goose`) < 6 &&
        itemAmount($item`teacher's pen`) >= 2
      )
        this.equip($item`teacher's pen`);
      this.equip($item`backup camera`);
      this.equip($item`birch battery`);
      this.equip($item`combat lover's locket`);
    }
    this.equip($item`miniature crystal ball`);
    // If we never found a better familiar, just keep charging the goose
    this.equip($familiar`Grey Goose`);
  }
}
