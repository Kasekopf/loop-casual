import {
  canEquip,
  Effect,
  equip,
  equippedAmount,
  equippedItem,
  getInventory,
  getWorkshed,
  Item,
  myMaxmp,
  myMp,
  numericModifier,
  Slot,
  toSlot,
} from "kolmafia";
import {
  $effect,
  $item,
  $skill,
  $slot,
  AsdonMartin,
  ensureEffect,
  get,
  have,
  uneffect,
} from "libram";
import { customRestoreMp } from "./engine";
import { asdonFillTo, asdonFualable } from "./resources";

function getRelevantEffects(): { [modifier: string]: Effect[] } {
  const result: { [name: string]: Effect[] } = {
    "-combat": [],
    "+combat": [],
    " combat": [], // Maximizer has issues with "50 +combat" and similar
  };

  if (
    have($item`Clan VIP Lounge key`) &&
    (!get("_olympicSwimmingPool") || have($effect`Silent Running`))
  )
    result["-combat"].push($effect`Silent Running`);

  // Noncombat/combat buffs
  if (have($skill`Phase Shift`)) result["-combat"].push($effect`Shifted Phase`);
  if (have($skill`Photonic Shroud`)) result["-combat"].push($effect`Darkened Photons`);
  if (have($skill`Piezoelectric Honk`)) result["+combat"].push($effect`Hooooooooonk!`);

  result[" combat"] = result["+combat"];
  return result;
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    if (have(effect) && have($item`soft green echo eyedrop antidote`)) uneffect(effect);
  }
}

export function moodCompatible(modifier: string | undefined): boolean {
  // Since shrugging is limited, ensure we do not attempt a +combat task
  // while under -combat effects, and vice-versa.
  if (modifier === undefined) return true;
  if (modifier.includes("+combat") || modifier.includes(" combat")) {
    return !have($effect`Shifted Phase`) && !have($effect`Darkened Photons`);
  }
  if (modifier.includes("-combat")) {
    return !have($effect`Hooooooooonk!`);
  }
  return true;
}

export function applyEffects(modifier: string): void {
  const relevantEffects = getRelevantEffects();

  const useful_effects = [];
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      useful_effects.push(...relevantEffects[key]);
    }
  }

  // Remove wrong combat effects
  if (modifier.includes("+combat") || modifier.includes(" combat"))
    shrug(relevantEffects["-combat"]);
  if (modifier.includes("-combat")) shrug(relevantEffects["+combat"]);

  const mpcosts = new Map<Effect, number>([
    [$effect`Shifted Phase`, 50],
    [$effect`Hooooooooonk!`, 50],
    [$effect`Darkened Photons`, 40],
  ]);

  // Apply all relevant effects
  const hotswapped: [Slot, Item][] = []; //
  for (const effect of useful_effects) {
    if (have(effect)) continue;

    // If we don't have the MP for this effect, hotswap some equipment
    const mpcost = mpcosts.get(effect) ?? 0;
    if (mpcost > myMaxmp()) {
      hotswapped.push(...swapEquipmentForMp(mpcost));
    }
    if (myMp() < mpcost) customRestoreMp(mpcost);
    ensureEffect(effect);
  }

  // If we hotswapped equipment, restore our old equipment (in-reverse, to work well if we moved equipment around)
  hotswapped.reverse();
  for (const [slot, item] of hotswapped) equip(item, slot);

  // Use asdon martin
  if (getWorkshed() === $item`Asdon Martin keyfob` && asdonFualable(37)) {
    // if (modifier.includes("-combat")) AsdonMartin.drive(AsdonMartin.Driving.Stealthily);
    // else if (modifier.includes("+combat")) AsdonMartin.drive(AsdonMartin.Driving.Obnoxiously);
    // else if (modifier.includes("init")) AsdonMartin.drive(AsdonMartin.Driving.Quickly);
    if (modifier.includes("meat") || modifier.includes("item")) {
      if (!have($effect`Driving Observantly`)) asdonFillTo(50); // done manually to use all-purpose flower
      AsdonMartin.drive(AsdonMartin.Driving.Observantly);
    }
  }
}

export function swapEquipmentForMp(mpgoal: number): [Slot, Item][] {
  const hotswapped: [Slot, Item][] = [];
  const inventory_options = Object.entries(getInventory())
    .map((v) => Item.get(v[0]))
    .filter((item) => numericModifier(item, "Maximum MP") > 0 && canEquip(item));
  for (const slot of Slot.all()) {
    if (mpgoal <= myMaxmp()) break;
    if (slot === $slot`weapon` || slot === $slot`off-hand`) continue; // skip weapon handedness (for now)
    const item = equippedItem(slot);
    if (item === $item`none`) continue;

    // Find an item in the same slot that gives more max MP
    const canonical_slot =
      slot === $slot`acc3` ? $slot`acc1` : slot === $slot`acc2` ? $slot`acc1` : slot;
    const slot_options = inventory_options
      .filter(
        (it) =>
          equippedAmount(it) === 0 &&
          toSlot(it) === canonical_slot &&
          numericModifier(it, "Maximum HP") >= numericModifier(item, "Maximum HP") &&
          numericModifier(it, "Maximum MP") > numericModifier(item, "Maximum MP")
      )
      .sort((a, b) => numericModifier(b, "Maximum MP") - numericModifier(a, "Maximum MP"));

    // If there is such an item, equip it
    if (slot_options.length === 0) continue;
    hotswapped.push([slot, item]);
    equip(slot, slot_options[0]);
  }
  return hotswapped;
}
