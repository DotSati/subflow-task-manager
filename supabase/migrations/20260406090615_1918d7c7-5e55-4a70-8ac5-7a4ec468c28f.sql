CREATE INDEX IF NOT EXISTS idx_tasks_user_id_complete_date ON tasks (user_id, complete_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_created_at ON tasks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_subtask_groups_task_id ON subtask_groups (task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags (task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags (tag_id);