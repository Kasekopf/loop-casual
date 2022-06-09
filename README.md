# Overview

This is a Grey You softcore script, based on the [loop-casual](https://github.com/Kasekopf/loop-casual) framework.

### Strategy

The script is designed to be run as part of a loop. In particular, it expects that something like [garbo](https://github.com/Loathing-Associates-Scripting-Society/garbage-collector) will use the rest of the turns. This means that profitable daily resources (e.g. copiers) are avoided, but other resources (free runaways, kills, some wanderers) are used to save turns where possible.

### Installation

This script is not currently in a state where it will work for most users out of the box. You may need to make a few custom typescript modifications. Thus it cannot yet be checked out through the mafia GUI.

1. Compile the script, following instructions in the [kol-ts-starter](https://github.com/docrostov/kol-ts-starter).
2. Copy [loopgyou.ccs](KoLmafia/ccs/loopgyou.ccs) from KoLmafia/ccs to your Mafia css directory.
3. Copy loopgyou.js and loopgyou-combat.js from KoLmafia/scripts/loop-gyou to your Mafia scripts directory.

### Usage

1. In aftercore, run `loopgyou sim` to verify that the script is installed, and to confirm that you meet the requirements (see below for more details).
2. Ascend into a Grey You Softcore run. The cold medicine cabinet is required in your workshed. Prefer the Vole sign until you have finished most of the path progression. Astral mask or astral belt are both useful, but neither is required. Prefer candles for your eurdora.
3. Run `loopgyou` and watch it go! If you are more hesitent, you can run `loopgyou actions 10` to only do 10 things and stop. Run `loopgyou help` for the full set of script options.

### Will this script work for me?

Run `loopgyou sim` to see "Is the script intended to work unmodified on my character?". A sample output is below, but it may be slightly out of date.

```
> loopgyou sim
Checking your character... Legend: ✓ Have / X Missing & Required / X Missing & Optional
IoTMs
✓ Clan VIP Lounge key - YRs, -combat
✓ Cold medicine cabinet - QoL Equipment
✓ combat lover's locket - Reminiscing
✓ combat lover's locket (Mountain man) - Reminiscing for Ore
✓ combat lover's locket (Pygmy witch lawyer locketed) - Reminiscing for Infinite Loop
✓ grey gosling - Adventures

IoTMs (Optional)
✓ baby camelCalf - Desert progress
✓ backup camera - Lobsterfrogmen, ML, init
✓ bottled Vampire Vintner - Pygmy killing
✓ Cargo Cultist Shorts - War outfit
✓ Cosmic bowling ball - Banishes, Pygmy killing
✓ cursed magnifying glass - Lobsterfrogmen, delay
✓ Deck of Every Card - Get a key for the NS tower
✓ fresh coat of paint - Minor boosts in moxie sign
✓ haunted doghouse - Ghost dog chow
✓ hewn moon-rune spoon - Access to an extra monster absorb (see tune arg)
✓ industrial fire extinguisher - Harem outfit, Bat hole, stone wool, Crypt, Ultrahydrated
✓ MayDay™ contract - +combat, early meat
✓ miniature crystal ball - Monster prediction
✓ Powerful Glove - Pixels and lobsterfrogmen
✓ protonic accelerator pack - Wanderers
✓ shortest-order cook - Kill the Wall of Skin, initial exp
✓ SongBoom™ BoomBox - In-run meat source
✓ SpinMaster™ lathe - Equipment
✓ Summon Clip Art - Amulet coin (via familiar jacks)
✓ unbreakable umbrella - -combat modifier, ML
✓ unwrapped knock-off retro superhero cape - Slay the dead in crypt, pygmy killing

Miscellany (Optional)
✓ Cornbeefadon - Amulet coin, with clip art
✓ hobo monkey - Meat drops
✓ woim - Bonus initiative

Expensive Pulls (Optional)
✓ deck of lewd playing cards - Pull
✓ Greatest American Pants OR navel ring of navel gazing - Pull
✓ mafia thumb ring - Pull
✓ old patched suit-pants - Pull
✓ Space Trip safety headphones OR HOA regulation book - Pull

You have everything! You are the shiniest star. This script should work great.
```
