import { Task } from "./tasks/structure";

export const routing: string[] = [
  "Toot/Finish",

  // Pickup items
  "Misc/Floundry",

  // Start with the basic leveling tasks
  "Leveling/Cloud Talk",
  "Leveling/Daycare",
  "Leveling/Bastille",
  "Leveling/Leaflet",
  "Leveling/Snojo",
  "Leveling/Chateau",

  // Then do the scaling leveling
  "Leveling/LOV Tunnel",
  "Leveling/Witchess",
  "Leveling/God Lobster",
  "Leveling/Machine Elf",
  "Leveling/Neverending Party",
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

  "Organ/Finish", // Get steel organ
  "Hidden City/Open Bowling", // Open bowling for optional free fights
  "Hidden City/Apartment", // Get this out of the way
  "Manor/Bedroom", // Open delay options
];

export function prioritize(tasks: Task[]): Task[] {
  const priorities = new Map<string, [number, Task]>();
  for (const task of tasks) {
    if (task.delay !== undefined) priorities.set(task.name, [2000, task]); // Finish delay as late as possible
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
