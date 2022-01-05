import { myMp, print } from "kolmafia";
import { all_tasks } from "./tasks/all";

export function checkMP(): string {
  if (myMp() < 200) {
    return "Your MP is less than 200.";
  } else {
    return "Your MP is greater than or equal to 200.";
  }
}

export function main(): void {
  const tasks = all_tasks();
  for (const key in tasks) {
    print(key);
    for (const after in tasks[key].after) {
      if (after in tasks) {
        print(`  ${after}`, "blue");
      } else {
        print(`  ${after}`, "red");
      }
    }
  }
}
