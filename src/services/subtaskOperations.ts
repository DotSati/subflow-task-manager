
import { supabase } from "@/integrations/supabase/client";
import { SubtaskFormData } from "@/types/task";
import { SubtaskServiceInterface } from "./types";

export const subtaskOperations: SubtaskServiceInterface = {
  // Add subtask with proper order index
  async addSubtask(taskId: string, subtaskData: SubtaskFormData, subtaskGroupId?: string): Promise<void> {
    // Get the next order index
    const { data: lastSubtask } = await supabase
      .from('subtasks')
      .select('order_index')
      .eq('task_id', taskId)
      .eq('subtask_group_id', subtaskGroupId || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastSubtask?.order_index ?? -1) + 1;

    const { error } = await supabase
      .from('subtasks')
      .insert({
        task_id: taskId,
        subtask_group_id: subtaskGroupId || null,
        name: subtaskData.name,
        content: subtaskData.content,
        order_index: nextOrderIndex,
      });

    if (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  },

  // Update subtask
  async updateSubtask(subtaskId: string, subtaskData: SubtaskFormData): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .update({
        name: subtaskData.name,
        content: subtaskData.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  },

  // Delete subtask
  async deleteSubtask(subtaskId: string): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },

  // Toggle subtask completion
  async toggleSubtaskComplete(subtaskId: string): Promise<void> {
    // First get the current subtask
    const { data: subtask, error: fetchError } = await supabase
      .from('subtasks')
      .select('complete_date')
      .eq('id', subtaskId)
      .single();

    if (fetchError) {
      console.error('Error fetching subtask:', fetchError);
      throw fetchError;
    }

    const isCompleted = !!subtask.complete_date;
    const { error } = await supabase
      .from('subtasks')
      .update({
        complete_date: isCompleted ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error toggling subtask completion:', error);
      throw error;
    }
  },

  // Move subtask with order index management
  async moveSubtask(subtaskId: string, targetGroupId: string | null, newIndex?: number): Promise<void> {
    // First, get the current subtask to know its current group
    const { data: currentSubtask } = await supabase
      .from('subtasks')
      .select('subtask_group_id, order_index')
      .eq('id', subtaskId)
      .single();

    if (!currentSubtask) {
      throw new Error('Subtask not found');
    }

    // If moving to a different group, get the appropriate order index
    let orderIndex = newIndex;
    if (orderIndex === undefined) {
      const { data: lastSubtask } = await supabase
        .from('subtasks')
        .select('order_index')
        .eq('subtask_group_id', targetGroupId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      orderIndex = (lastSubtask?.order_index ?? -1) + 1;
    }

    const { error } = await supabase
      .from('subtasks')
      .update({
        subtask_group_id: targetGroupId,
        order_index: orderIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error moving subtask:', error);
      throw error;
    }
  },

  // Toggle subtask skip status
  async toggleSubtaskSkip(subtaskId: string): Promise<void> {
    // First get the current subtask
    const { data: subtask, error: fetchError } = await supabase
      .from('subtasks')
      .select('skipped')
      .eq('id', subtaskId)
      .single();

    if (fetchError) {
      console.error('Error fetching subtask:', fetchError);
      throw fetchError;
    }

    const { error } = await supabase
      .from('subtasks')
      .update({
        skipped: !subtask.skipped,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error toggling subtask skip:', error);
      throw error;
    }
  },

  // Toggle skip status for all subtasks in a group
  async skipAllSubtasksInGroup(groupId: string): Promise<void> {
    // First, get all subtasks in the group to check their current skip status
    const { data: subtasks, error: fetchError } = await supabase
      .from('subtasks')
      .select('id, skipped')
      .eq('subtask_group_id', groupId);

    if (fetchError) {
      console.error('Error fetching subtasks in group:', fetchError);
      throw fetchError;
    }

    if (!subtasks || subtasks.length === 0) {
      return; // No subtasks in group
    }

    // Check if all subtasks are currently skipped
    const allSkipped = subtasks.every(subtask => subtask.skipped);
    
    // Toggle: if all are skipped, unskip them all; otherwise, skip them all
    const newSkippedStatus = !allSkipped;

    const { error } = await supabase
      .from('subtasks')
      .update({
        skipped: newSkippedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('subtask_group_id', groupId);

    if (error) {
      console.error('Error toggling skip status for all subtasks in group:', error);
      throw error;
    }
  },

  // Toggle completion status for all subtasks in a group
  async completeAllSubtasksInGroup(groupId: string): Promise<void> {
    // First, get all subtasks in the group to check their current completion status
    const { data: subtasks, error: fetchError } = await supabase
      .from('subtasks')
      .select('id, complete_date')
      .eq('subtask_group_id', groupId);

    if (fetchError) {
      console.error('Error fetching subtasks in group:', fetchError);
      throw fetchError;
    }

    if (!subtasks || subtasks.length === 0) {
      return; // No subtasks in group
    }

    // Check if all subtasks are currently completed
    const allCompleted = subtasks.every(subtask => !!subtask.complete_date);
    
    // Toggle: if all are completed, uncomplete them all; otherwise, complete them all
    const newCompleteDate = allCompleted ? null : new Date().toISOString();

    const { error } = await supabase
      .from('subtasks')
      .update({
        complete_date: newCompleteDate,
        updated_at: new Date().toISOString(),
      })
      .eq('subtask_group_id', groupId);

    if (error) {
      console.error('Error toggling completion status for all subtasks in group:', error);
      throw error;
    }
  },

  // Enhanced reordering functions with proper order index updates
  async reorderSubtasks(subtaskIds: string[], groupId?: string): Promise<void> {
    const promises = subtaskIds.map((id, index) =>
      supabase
        .from('subtasks')
        .update({
          order_index: index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    
    for (const result of results) {
      if (result.error) {
        console.error('Error reordering subtasks:', result.error);
        throw result.error;
      }
    }
  },
};
