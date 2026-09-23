/**
 * Infernal Mobs Bedrock - Distributed Tick Scheduler
 * Distributes processing across ticks to avoid frame drops
 */

import { system } from "@minecraft/server";
import { pruneDamageGuards } from "../util/guards.js";

let currentTick = 0;
const recurringTasks = [];

/**
 * Returns current global tick counter
 */
export function getCurrentTick() {
  return currentTick;
}

/**
 * Registers a recurring task to execute every `intervalTicks`
 * @param {string} name
 * @param {number} intervalTicks
 * @param {function(number): void} callback
 */
export function registerRecurringTask(name, intervalTicks, callback) {
  recurringTasks.push({
    name,
    intervalTicks: Math.max(1, intervalTicks),
    callback,
    lastRunTick: 0
  });
}

/**
 * Starts the master tick loop using system.runInterval
 */
export function startTickScheduler() {
  system.runInterval(() => {
    currentTick++;

    // Prune expired recursion guards every 10 ticks
    if (currentTick % 10 === 0) {
      pruneDamageGuards(currentTick);
    }

    // Run scheduled tasks
    for (const task of recurringTasks) {
      if (currentTick - task.lastRunTick >= task.intervalTicks) {
        task.lastRunTick = currentTick;
        try {
          task.callback(currentTick);
        } catch (error) {
          console.error(`[InfernalMobs][Scheduler] Error in task ${task.name}:`, error);
        }
      }
    }
  }, 1);
}
