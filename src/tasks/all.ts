import { DietQuest } from "./diet";
import { TootQuest } from "./level1";
import { MosquitoQuest } from "./level2";
import { TavernQuest } from "./level3";
import { BatQuest } from "./level4";
import { KnobQuest } from "./level5";
import { FriarQuest, OrganQuest } from "./level6";
import { CryptQuest } from "./level7";
import { McLargeHugeQuest } from "./level8";
import { ChasmQuest } from "./level9";
import { GiantQuest } from "./level10";
import { HiddenQuest } from "./level11_hidden";
import { ManorQuest } from "./level11_manor";
import { PalindomeQuest } from "./level11_palindome";
import { MacguffinQuest } from "./level11";
import { WarQuest } from "./level12";
import { TowerQuest } from "./level13";
import { KeysQuest, MiscQuest } from "./misc";
import { Quest, Task } from "./structure";
import { LevelingQuest } from "./leveling";

function buildTaskList(quests: Quest[]): Task[] {
  const result: Task[] = [];
  for (const quest of quests) {
    for (const task of quest.tasks) {
      // Include quest name in task names and dependencies (unless dependency quest is given)
      task.name = `${quest.name}/${task.name}`;
      task.after = task.after.map((after) =>
        after.includes("/") ? after : `${quest.name}/${after}`
      );
      result.push(task);
    }
  }

  // Verify the dependency names of all tasks
  const names = new Set<string>();
  for (const task of result) names.add(task.name);
  for (const task of result) {
    for (const after of task.after) {
      if (!names.has(after)) {
        throw `Unknown task dependency ${after} of ${task.name}`;
      }
    }
  }
  return result;
}

export function all_tasks(): Task[] {
  const quests = [
    TootQuest,
    LevelingQuest,
    MiscQuest,
    KeysQuest,
    DietQuest,
    MosquitoQuest,
    TavernQuest,
    BatQuest,
    KnobQuest,
    FriarQuest,
    OrganQuest,
    CryptQuest,
    McLargeHugeQuest,
    ChasmQuest,
    GiantQuest,
    HiddenQuest,
    ManorQuest,
    PalindomeQuest,
    MacguffinQuest,
    WarQuest,
    TowerQuest,
  ];
  return buildTaskList(quests);
}

export function quest_tasks(): Task[] {
  const quests = [
    TootQuest,
    MiscQuest,
    KeysQuest,
    DietQuest,
    MosquitoQuest,
    TavernQuest,
    BatQuest,
    KnobQuest,
    FriarQuest,
    CryptQuest,
    McLargeHugeQuest,
    ChasmQuest,
    GiantQuest,
    HiddenQuest,
    ManorQuest,
    PalindomeQuest,
    MacguffinQuest,
    WarQuest,
    TowerQuest,
  ];
  return buildTaskList(quests);
}

export function level_tasks(): Task[] {
  return buildTaskList([LevelingQuest]);
}

export function organ_tasks(): Task[] {
  return buildTaskList([FriarQuest, OrganQuest]);
}
