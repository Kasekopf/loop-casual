import { Effect } from "kolmafia";
import { $effect, $item, $skill, ensureEffect, get, have, uneffect } from "libram";

function getRelevantEffects(): { [modifier: string]: Effect[] } {
  const result: { [name: string]: Effect[] } = {
    "-combat": [],
    "+combat": [],
    mainstat: [],
  };

  // Glitches if given above
  result["mainstat"].push($effect`That's Just Cloud-Talk, Man`);

  // One-per-day
  if (!get("_ballpit")) result["mainstat"].push($effect`Having a Ball!`);
  if (!get("_lyleFavored")) result["mainstat"].push($effect`Favored by Lyle`);
  if (!get("telescopeLookedHigh")) result["mainstat"].push($effect`Starry-Eyed`);
  if (get("spacegateAlways") && get("spacegateVaccine2") && !get("_spacegateVaccine"))
    result["mainstat"].push($effect`Broad-Spectrum Vaccine`);
  if (have($skill`Emotionally Chipped`) && get("_feelExcitementUsed") < 3)
    result["mainstat"].push($effect`Feeling Excited`);
  if (have($item`protonic accelerator pack`) && !get("_streamsCrossed"))
    result["mainstat"].push($effect`Total Protonic Reversal`);

  // Noncombat/combat buffs
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Phase Shift`)) result["-combat"].push($effect`Shifted Phase`);
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Photonic Shroud`)) result["-combat"].push($effect`Darkened Photons`);
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Piezoelectric Honk`)) result["+combat"].push($effect`Hooooooooonk!`);

  return result;
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    if (have(effect)) uneffect(effect);
  }
}

export function moodCompatible(modifier: string | undefined): boolean {
  // Since shrugging is limited, ensure we do not attempt a +combat task
  // while under -combat effects, and vice-versa.
  if (modifier === undefined) return true;
  if (modifier.includes("+combat")) {
    // eslint-disable-next-line libram/verify-constants
    return !have($effect`Shifted Phase`) && !have($effect`Darkened Photons`);
  }
  if (modifier.includes("-combat")) {
    // eslint-disable-next-line libram/verify-constants
    return !have($effect`Hooooooooonk!`);
  }
  return true;
}

export function applyEffects(modifier: string, required: Effect[]): void {
  const relevantEffects = getRelevantEffects();

  const useful_effects = [];
  useful_effects.push(...required);
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      useful_effects.push(...relevantEffects[key]);
    }
  }

  // Remove wrong combat effects
  if (modifier.includes("+combat")) shrug(relevantEffects["-combat"]);
  if (modifier.includes("-combat")) shrug(relevantEffects["+combat"]);

  // Apply all relevant effects
  for (const effect of useful_effects) {
    ensureEffect(effect);
  }
}
