import { myEffects, toSkill } from "kolmafia";
import { $class, $effects, ensureEffect, have, uneffect } from "libram";

const relevantEffects: { [modifier: string]: Effect[] } = {
  "-combat": $effects`Smooth Movements, The Sonata of Sneakiness`,
  "+combat": $effects`Carlweather's Cantata of Confrontation, Musk of the Moose`,
  "": $effects`Blood Bond, Empathy, Leash of Linguini, Astral Shell, Elemental Saucesphere`,
  "fam weight": $effects`Chorale of Companionship`,
  init: $effects`Walberg's Dim Bulb, Springy Fusilli`,
  ML: $effects`Ur-Kel's Aria of Annoyance, Pride of the Puffin, Drescher's Annoying Noise`,
  item: $effects`Fat Leon's Phat Loot Lyric, Singer's Faithful Ocelot`,
  mainstat: $effects`Song of Bravado, Big, Having a Ball!, Tomato Power, Trivia Master, Gr8ness, Favored by Lyle, Starry-Eyed, Carol of the Hells, Carol of the Thrills, That's Just Cloud-Talk\, Man`,
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

export function applyEffects(modifier: string): void {
  const useful_effects = [];
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      useful_effects.push(...relevantEffects[key]);
    }
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
