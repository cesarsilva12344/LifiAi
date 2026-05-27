/**
 * services/engine/index.ts
 *
 * Ponto de entrada dos engines.
 * Importe daqui, nunca dos arquivos individuais.
 *
 * import { createExpense, createTask, createReminder, getContext, handleCommand } from '../services/engine';
 */

// Action Engine
export {
  createExpense,
  createIncome,
  createTask,
  createReminder,
  createGoal,
  createHabit,
  createProject,
  createNote,
  createIdea,
  createMemory,
  updateTask,
  completeTask,
  updateGoalProgress,
  checkHabit,
  updateProject,
  deleteEntity,
  executeFromIntent,
} from './action';
export type { ActionResult } from './action';

// Context Engine
export { getContext, formatContext } from './context';
export type { AssembledContext, FinancialSummary } from './context';

// Command Engine
export { handleCommand, isCommand } from './command';
export type { CommandResult } from './command';
