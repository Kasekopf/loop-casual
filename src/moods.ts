import {
  Effect,
  myClass,
} from "kolmafia";
import {
  $class,
  $effect,
  $skill,
  ensureEffect,
  get,
  have,
  uneffect,
} from "libram";

function getRelevantEffects(): { [modifier: string]: Effect[] } {
  const result: {[name: string]: Effect[]} = {
    "-combat": [],
    "+combat": [],
    mainstat: [],
  };

  // Glitches if given above
  result["mainstat"].push(Effect.get(2499)); // That's Just Cloud-Talk, Man

  // Class-specific
  if (myClass() === $class`Seal Clubber`) result["init"].push($effect`Silent Hunting`);
  else result["init"].push($effect`Nearly Silent Hunting`);

  // One-per-day
  if (!get("_ballpit")) result["mainstat"].push($effect`Having a Ball!`);
  if (!get("_lyleFavored")) result["mainstat"].push($effect`Favored by Lyle`);
  if (!get("telescopeLookedHigh")) result["mainstat"].push($effect`Starry-Eyed`);

  // Noncombat/combat buffs
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Phase Shift`)) result["-combat"].push($effect`Shifted Phase`);
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Photonic Shroud`)) result["-combat"].push($effect`Darkened Photons`);
  // eslint-disable-next-line libram/verify-constants
  if (have($skill`Piezoelectric Honk`)) result["-combat"].push($effect`Hooooooooonk!`);

  return result;
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    if (have(effect)) uneffect(effect);
  }
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
