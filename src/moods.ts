import { myEffects, myPrimestat, toSkill } from "kolmafia";
import { $class, $effect, $effects, $stat, ensureEffect, have, uneffect } from "libram";

const relevantEffects: { [modifier: string]: Effect[] } = {
  "-combat": $effects`Smooth Movements, The Sonata of Sneakiness`,
  "+combat": $effects`Carlweather's Cantata of Confrontation, Musk of the Moose`,
  "": $effects`Empathy, Leash of Linguini, Astral Shell, Elemental Saucesphere`,
  "fam weight": $effects`Chorale of Companionship`,
  init: $effects`Walberg's Dim Bulb, Springy Fusilli`,
  ML: $effects`Ur-Kel's Aria of Annoyance, Pride of the Puffin, Drescher's Annoying Noise`,
  item: $effects`Fat Leon's Phat Loot Lyric, Singer's Faithful Ocelot`,
  mainstat: $effects`Song of Bravado, Big, Having a Ball!, Tomato Power, Trivia Master, Gr8ness, Favored by Lyle, Starry-Eyed, Carol of the Hells, Carol of the Thrills`,
  muscle: $effects`Lack of Body-Building, Go Get 'Em\, Tiger!, Phorcefullness, Incredibly Hulking, Muscle Unbound`,
  mysticality: $effects`We're All Made of Starfish, Inscrutable Gaze, Glittering Eyelashes, Mystically Oiled, On the Shoulders of Giants`,
  moxie: $effects`Pomp & Circumsands, Butt-Rock Hair, Superhuman Sarcasm, Cock of the Walk`,
};

function isSong(effect: Effect) {
  return toSkill(effect).class === $class`Accordion Thief` && toSkill(effect).buff;
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    if (have(effect)) uneffect(effect);
  }
}

export function applyEffects(modifier: string, required: Effect[]): void {
  const useful_effects = [];
  useful_effects.push(...required);
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      useful_effects.push(...relevantEffects[key]);
    }
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
