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
import { DigitalQuest, KeysQuest, MiscQuest } from "./misc";
import { Task } from "../engine/task";
import { LevelingQuest } from "./leveling";
import { getTasks } from "grimoire-kolmafia";

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
    DigitalQuest,
    TowerQuest,
  ];
  return getTasks(quests);
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
    DigitalQuest,
    TowerQuest,
  ];
  return getTasks(quests);
}

export function level_tasks(): Task[] {
  return getTasks([LevelingQuest]);
}

export function organ_tasks(): Task[] {
  return getTasks([TootQuest, FriarQuest, OrganQuest]);
}
