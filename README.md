# Overview

This is a casual script designed to work if you are me, [Kasekopf (#1210810)](https://cheesellc.com/kol/profile.php?u=Kasekopf). I mostly run as a Seal Clubber.

### Strategy

The script is designed to be run as part of a loop. In particular, it expects that something like [garbo](https://github.com/Loathing-Associates-Scripting-Society/garbage-collector) will use the rest of the turns. This means that profitable daily resources (e.g. copiers) are avoided, but other resources (free runaways, kills, some wanderers) are used to save turns where possible.

### Installation

This script is not currently in a state where it will work for most users out of the box. You may need to make a few custom typescript modifications. Thus it cannot yet be checked out through the mafia GUI.

1. Compile the script, following instructions in the [kol-ts-starter](https://github.com/docrostov/kol-ts-starter).
2. Copy loopcasual.js from KoLmafia/scripts/loop-casual to your Mafia scripts directory.
