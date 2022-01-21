import { mallPrice, myClass, myEffects, myPrimestat, toSkill } from "kolmafia";
import { $class, $effect, $effects, $item, $stat, ensureEffect, get, have, uneffect } from "libram";

function getRelevantEffects(): { [modifier: string]: Effect[] } {
  const result = {
    "-combat": $effects`Smooth Movements, The Sonata of Sneakiness`,
    "+combat": $effects`Carlweather's Cantata of Confrontation, Musk of the Moose`,
    "": $effects`Empathy, Leash of Linguini, Astral Shell, Elemental Saucesphere`,
    "fam weight": $effects`Chorale of Companionship`,
    init: $effects`Walberg's Dim Bulb, Springy Fusilli`,
    ML: $effects`Ur-Kel's Aria of Annoyance, Pride of the Puffin, Drescher's Annoying Noise`,
    item: $effects`Fat Leon's Phat Loot Lyric, Singer's Faithful Ocelot`,
    meat: $effects`Polka of Plenty`,
    mainstat: $effects`Big, Tomato Power, Trivia Master, Gr8ness, Carol of the Hells, Carol of the Thrills`,
    muscle: $effects`Go Get 'Em\, Tiger!, Phorcefullness, Incredibly Hulking`,
    mysticality: $effects`Glittering Eyelashes, Mystically Oiled, On the Shoulders of Giants`,
    moxie: $effects`Butt-Rock Hair, Superhuman Sarcasm, Cock of the Walk`,
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

  // Potions to be used if cheap
  if (mallPrice($item`ear candle`) < 2000 || have($item`ear candle`))
    result["init"].push($effect`Clear Ears, Can't Lose`);
  if (mallPrice($item`panty raider camouflage` || have($item`panty raider camouflage`)) < 2000)
    result["init"].push($effect`Hiding in Plain Sight`);
  if (
    mallPrice($item`Freddie's blessing of Mercury` || have($item`Freddie's blessing of Mercury`)) <
    2000
  )
    result["init"].push($effect`You're High as a Crow, Marty`);

  return result;
}

function isSong(effect: Effect) {
  return toSkill(effect).class === $class`Accordion Thief` && toSkill(effect).buff;
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

  if (modifier.includes("MP")) {
    useful_effects.push(...relevantEffects["mysticality"]);
  }

  // Handle mainstat buffing and equalizing
  switch (myPrimestat()) {
    case $stat`Muscle`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["muscle"]);
      if (modifier.includes("moxie") || modifier.includes("myst"))
        useful_effects.push($effect`Stabilizing Oiliness`);
      break;
    case $stat`Mysticality`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["mysticality"]);
      if (modifier.includes("moxie") || modifier.includes("muscle"))
        useful_effects.push($effect`Expert Oiliness`);
      break;
    case $stat`Moxie`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["moxie"]);
      if (modifier.includes("muscle") || modifier.includes("myst"))
        useful_effects.push($effect`Slippery Oiliness`);
      break;
  }

  // Remove wrong combat effects
  if (modifier.includes("+combat")) shrug(relevantEffects["-combat"]);
  if (modifier.includes("-combat")) shrug(relevantEffects["+combat"]);

  // Make room for songs
  const songs = [];
  for (const effect of useful_effects) {
    if (isSong(effect)) songs.push(effect);
  }
  if (songs.length > 3) throw "Too many AT songs.";
  if (songs.length > 0) {
    const extra_songs = [];
    for (const effect_name of Object.keys(myEffects())) {
      const effect = Effect.get(effect_name);
      if (isSong(effect) && !songs.includes(effect)) {
        extra_songs.push(effect);
      }
    }
    while (songs.length + extra_songs.length > 3) {
      const to_remove = extra_songs.pop();
      if (to_remove === undefined) break;
      else uneffect(to_remove);
    }
  }

  // Apply all relevant effects
  for (const effect of useful_effects) {
    ensureEffect(effect);
  }
}
