import { familiarWeight, myTurncount } from "kolmafia";
import { $familiar } from "libram";

export function mayLaunchGooseForStats() {
  // Launch early on if we have short-order cook
  return familiarWeight($familiar`Grey Goose`) >= 9 && myTurncount() < 5;
}
