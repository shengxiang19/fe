export interface AICronTask {
  id?: number;
  name: string;
  description?: string;
  cron_expr: string;
  use_case?: string; // default 'cron_task' (unattended turn chain; not exposed in the form)
  llm_config_id?: number; // 0 = default LLM
  skill_ids?: number[];
  content: string; // prompt text
  enabled?: boolean;
  chat_id?: string;
  last_run_at?: number; // unix seconds
  next_run_at?: number;
  last_status?: '' | 'running' | 'success' | 'failed' | 'pending';
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  llm_config_name?: string;
}

export interface AICronTaskLog {
  id: number;
  task_id: number;
  chat_id: string;
  seq_id: number;
  // pending = 该轮以等人确认/补参收尾，需到执行会话里接管
  status: 'running' | 'success' | 'failed' | 'pending';
  started_at: number;
  ended_at: number;
  error?: string;
  // 执行会话已被用户删除（后端探测，此时不可查看结果）
  chat_deleted?: boolean;
}

export interface AICronTaskRunResult {
  chat_id: string;
  seq_id: number;
  log_id: number;
}

export type FormValues = {
  name: string;
  description: string;
  content: string;
  cron_expr: string;
  llm_config_id: number;
  skill_ids?: number[];
  enabled: boolean;
};
