import { Location, Monster, myBasestat, print, toLocation, toMonster, visitUrl } from "kolmafia";
import { $monster, $stat, get } from "libram";

export function debug(message: string, color?: string): void {
  if (color) {
    print(message, color);
  } else {
    print(message);
  }
}

// From phccs
export function convertMilliseconds(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.round((seconds - minutes * 60) * 1000) / 1000;
  const hours = Math.floor(minutes / 60);
  const minutesLeft = Math.round(minutes - hours * 60);
  return (
    (hours !== 0 ? `${hours} hours, ` : "") +
    (minutesLeft !== 0 ? `${minutesLeft} minutes, ` : "") +
    (secondsLeft !== 0 ? `${secondsLeft} seconds` : "")
  );
}

export function atLevel(level: number): boolean {
  const goal = (level - 1) ** 2 + 4;
  return (
    myBasestat($stat`muscle`) >= goal ||
    myBasestat($stat`mysticality`) >= goal ||
    myBasestat($stat`moxie`) >= goal
  );
}

function getMonster(name: string) {
  if (name === "some Mismatched Twins") return $monster`Mismatched Twins`;
  if (name === "the Bubblemint Twins") return $monster`Bubblemint Twins`;
  if (name === "the Big Wheelin' Twins") return $monster`Big Wheelin' Twins`;
  if (name === "the Troll Twins") return $monster`Troll Twins`;
  if (name === "the Mob Penguin Capo") return $monster`Mob Penguin Capo`;
  return toMonster(name);
}

export function ponderPrediction(): Map<Location, Monster> {
  visitUrl("inventory.php?ponder=1", false);
  const parsedProp = new Map(
    get("crystalBallPredictions")
      .split("|")
      .map((element) => element.split(":") as [string, string, string])
      .map(
        ([, location, monster]) =>
          [toLocation(location), getMonster(monster)] as [Location, Monster]
      )
  );
  return parsedProp;
}
