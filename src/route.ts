import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Start with the basic leveling tasks
  "Leveling/Daycare",
  "Leveling/Bastille",
  "Leveling/Chateau",

  // Then do the scaling leveling
  "Leveling/LOV Tunnel",
  "Leveling/God Lobster",
  "Leveling/Neverending Party",
  "Leveling/Machine Elf",
  "Leveling/Sausage Fights",

  // Do the billards room first, before drinking
  "Manor/Billiards",
  "Misc/Consume",

  // Start Shen next
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Palindome/Hot Snake Precastle",
  "Palindome/Hot Snake Postcastle",
  "Palindome/Hot Snake Postcastle",

  // Open bowling for optional free fights
  "Hidden City/Open Bowling",
];

export function prioritize(tasks: Task[]): Task[] {
  const priorities = new Map<string, [number, Task]>();
  for (const task of tasks) {
    priorities.set(task.name, [1000, task]);
  }

  // Prioritize the routing list of tasks first
  function set_priority_recursive(task: string, priority: number) {
    const old_priority = priorities.get(task);
    if (old_priority === undefined) throw `Unknown routing task ${task}`;
    if (old_priority[0] <= priority) return;
    priorities.set(task, [priority, old_priority[1]]);

    for (const requirement of old_priority[1].after) {
      set_priority_recursive(requirement, priority - 0.01);
    }
  }
  for (let i = 0; i < routing.length; i++) {
    set_priority_recursive(routing[i], i);
  }

  // Sort all tasks by priority.
  // Since this sort is stable, we default to earlier tasks.
  const result = tasks.slice();
  result.sort(
    (a, b) => (priorities.get(a.name) || [1000])[0] - (priorities.get(b.name) || [1000])[0]
  );
  return result;
}
