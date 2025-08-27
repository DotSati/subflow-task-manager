
import { Task, TaskFormData, SubtaskFormData } from "@/types/task";

export interface TaskServiceInterface {
  getTasks(): Promise<Task[]>;
  getTask(taskId: string): Promise<Task>;
  createTask(data: TaskFormData): Promise<Task>;
  updateTask(taskId: string, data: TaskFormData): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  toggleTaskComplete(taskId: string): Promise<void>;
  copyTask(taskId: string): Promise<Task>;
}

export interface SubtaskServiceInterface {
  addSubtask(taskId: string, subtaskData: SubtaskFormData, subtaskGroupId?: string): Promise<void>;
  updateSubtask(subtaskId: string, subtaskData: SubtaskFormData): Promise<void>;
  deleteSubtask(subtaskId: string): Promise<void>;
  toggleSubtaskComplete(subtaskId: string): Promise<void>;
  toggleSubtaskSkip(subtaskId: string): Promise<void>;
  moveSubtask(subtaskId: string, targetGroupId: string | null, newIndex?: number): Promise<void>;
  skipAllSubtasksInGroup(groupId: string): Promise<void>;
  reorderSubtasks(subtaskIds: string[], groupId?: string): Promise<void>;
}

export interface SubtaskGroupServiceInterface {
  addSubtaskGroup(taskId: string, groupName: string): Promise<void>;
  updateSubtaskGroup(groupId: string, groupName: string): Promise<void>;
  deleteSubtaskGroup(groupId: string): Promise<void>;
  reorderSubtaskGroups(taskId: string, groupIds: string[]): Promise<void>;
}
