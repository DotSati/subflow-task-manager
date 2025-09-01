import { supabase } from "@/integrations/supabase/client";
import { Task, TaskFormData } from "@/types/task";
import { TaskServiceInterface } from "./types";

export const taskOperations: TaskServiceInterface = {
  // Get all tasks for the current user with subtasks, subtask groups, and tags
  async getTasks(): Promise<Task[]> {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*),
        subtask_groups (
          *,
          subtasks (*)
        ),
        task_tags (
          tags (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return tasks.map(task => ({
      ...task,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      completeDate: task.complete_date ? new Date(task.complete_date) : undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      subtasks: task.subtasks
        .map((subtask: any) => ({
          ...subtask,
          dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
          completeDate: subtask.complete_date ? new Date(subtask.complete_date) : undefined,
          createdAt: new Date(subtask.created_at),
          updatedAt: new Date(subtask.updated_at),
          orderIndex: subtask.order_index ?? 0,
        }))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
      subtaskGroups: task.subtask_groups
        .map((group: any) => ({
          ...group,
          createdAt: new Date(group.created_at),
          updatedAt: new Date(group.updated_at),
          orderIndex: group.order_index ?? 0,
          subtasks: group.subtasks
            .map((subtask: any) => ({
              ...subtask,
              dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
              completeDate: subtask.complete_date ? new Date(subtask.complete_date) : undefined,
              createdAt: new Date(subtask.created_at),
              updatedAt: new Date(subtask.updated_at),
              orderIndex: subtask.order_index ?? 0,
            }))
            .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
        }))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
      tags: task.task_tags?.map((taskTag: any) => ({
        ...taskTag.tags,
        createdAt: new Date(taskTag.tags.created_at),
        updatedAt: new Date(taskTag.tags.updated_at),
      })) || [],
    }));
  },

  // Get a specific task
  async getTask(taskId: string): Promise<Task> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*),
        subtask_groups (
          *,
          subtasks (*)
        ),
        task_tags (
          tags (*)
        )
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      throw error;
    }

    return {
      ...task,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      completeDate: task.complete_date ? new Date(task.complete_date) : undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      subtasks: task.subtasks
        .map((subtask: any) => ({
          ...subtask,
          dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
          completeDate: subtask.complete_date ? new Date(subtask.complete_date) : undefined,
          createdAt: new Date(subtask.created_at),
          updatedAt: new Date(subtask.updated_at),
          orderIndex: subtask.order_index ?? 0,
        }))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
      subtaskGroups: task.subtask_groups
        .map((group: any) => ({
          ...group,
          createdAt: new Date(group.created_at),
          updatedAt: new Date(group.updated_at),
          orderIndex: group.order_index ?? 0,
          subtasks: group.subtasks
            .map((subtask: any) => ({
              ...subtask,
              dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
              completeDate: subtask.complete_date ? new Date(subtask.complete_date) : undefined,
              createdAt: new Date(subtask.created_at),
              updatedAt: new Date(subtask.updated_at),
              orderIndex: subtask.order_index ?? 0,
            }))
            .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
        }))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
      tags: task.task_tags?.map((taskTag: any) => ({
        ...taskTag.tags,
        createdAt: new Date(taskTag.tags.created_at),
        updatedAt: new Date(taskTag.tags.updated_at),
      })) || [],
    };
  },

  // Create a new task
  async createTask(data: TaskFormData): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        name: data.name,
        content: data.content,
        due_date: data.dueDate ? data.dueDate.toISOString().split('T')[0] : null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    // Add tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      const { tagOperations } = await import('./tagOperations');
      await tagOperations.addTagsToTask(task.id, data.tagIds);
    }

    return {
      ...task,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      completeDate: task.complete_date ? new Date(task.complete_date) : undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      subtasks: [],
      subtaskGroups: [],
      tags: [],
    };
  },

  // Update an existing task
  async updateTask(taskId: string, data: TaskFormData): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        name: data.name,
        content: data.content,
        due_date: data.dueDate ? data.dueDate.toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    // Update tags if provided
    if (data.tagIds !== undefined) {
      const { tagOperations } = await import('./tagOperations');
      await tagOperations.updateTaskTags(taskId, data.tagIds);
    }
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Toggle task completion
  async toggleTaskComplete(taskId: string): Promise<void> {
    // First get the current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('complete_date')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      throw fetchError;
    }

    const newCompleteDate = task.complete_date ? null : new Date().toISOString();

    const { error } = await supabase
      .from('tasks')
      .update({
        complete_date: newCompleteDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  },

  // Copy a task with all subtasks and subtask groups (but without tags)
  async copyTask(taskId: string): Promise<Task> {
    const originalTask = await taskOperations.getTask(taskId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        name: `${originalTask.name} (Copy)`,
        content: originalTask.content,
        due_date: originalTask.dueDate ? originalTask.dueDate.toISOString().split('T')[0] : null,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error copying task:', error);
      throw error;
    }

    const newTaskId = data.id;

    const groupIdMapping: { [oldId: string]: string } = {};
    
    for (const group of originalTask.subtaskGroups) {
      const { data: newGroup, error: groupError } = await supabase
        .from('subtask_groups')
        .insert({
          task_id: newTaskId,
          name: group.name,
          order_index: group.orderIndex,
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error copying subtask group:', groupError);
        throw groupError;
      }

      groupIdMapping[group.id] = newGroup.id;

      for (const subtask of group.subtasks) {
         // Note: File URLs in content are preserved as-is since they include user ID
         const { error: subtaskError } = await supabase
           .from('subtasks')
           .insert({
             task_id: newTaskId,
             subtask_group_id: newGroup.id,
             name: subtask.name,
             content: subtask.content, // File URLs preserved
             due_date: subtask.dueDate ? subtask.dueDate.toISOString().split('T')[0] : null,
             order_index: subtask.orderIndex,
             complete_date: null,
             skipped: false,
           });

        if (subtaskError) {
          console.error('Error copying subtask in group:', subtaskError);
          throw subtaskError;
        }
      }
    }

    const ungroupedSubtasks = originalTask.subtasks.filter(subtask => 
      !originalTask.subtaskGroups.some(group => 
        group.subtasks.some(groupSubtask => groupSubtask.id === subtask.id)
      )
    );

    for (const subtask of ungroupedSubtasks) {
       // Note: File URLs in content are preserved as-is since they include user ID
       const { error: subtaskError } = await supabase
         .from('subtasks')
         .insert({
           task_id: newTaskId,
           subtask_group_id: null,
           name: subtask.name,
           content: subtask.content, // File URLs preserved
           due_date: subtask.dueDate ? subtask.dueDate.toISOString().split('T')[0] : null,
           order_index: subtask.orderIndex,
           complete_date: null,
           skipped: false,
         });

      if (subtaskError) {
        console.error('Error copying ungrouped subtask:', subtaskError);
        throw subtaskError;
      }
    }

    return {
      id: data.id,
      name: data.name,
      content: data.content || '',
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      completeDate: undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      subtasks: [],
      subtaskGroups: [],
      tags: []
    };
  },
};
