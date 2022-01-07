import {} from "kolmafia";
import { $effects, ensureEffect } from "libram";

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

function ensure(effects: Effect[]) {
  for (const effect of effects) {
    ensureEffect(effect);
  }
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    ensureEffect(effect);
  }
}

export function applyEffects(modifier: string): void {
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      ensure(relevantEffects[key]);
    }
  }

  if (modifier.includes("+combat")) shrug(relevantEffects["-combat"]);
  if (modifier.includes("-combat")) shrug(relevantEffects["+combat"]);
}
