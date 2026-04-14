export interface DeveloperItem {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  avatar?: string | null;
  wechat_nickname?: string | null;
  status: number;
  is_dev: number;
  last_login_time?: string | null;
  last_login_platform?: string | null;
  apple_user_identifier?: string | null;
  apple_email?: string | null;
  dev_subscription_plan?: string | null;
  dev_subscription_expires_at?: string | null;
  dev_trial_started_at?: string | null;
  dev_trial_expires_at?: string | null;
  dev_invite_code?: string | null;
  dev_invited_by?: number | null;
  dev_reward_balance?: number | string;
  dev_total_rewards?: number | string;
  dev_last_payment_at?: string | null;
}

export interface DeveloperQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  subscription_status?: string;
  subscription_plan?: string;
}

export interface DeveloperPayload {
  name: string;
  phone: string;
  email?: string;
  status?: 'active' | 'disabled';
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  trial_expires_at?: string | null;
  reward_balance?: number | string | null;
  total_rewards?: number | string | null;
  regenerate_invite_code?: boolean;
}

export interface DeveloperListSummary {
  active: number;
  trial: number;
  expired: number;
  lifetime: number;
  reward_balance_sum: number;
}

export interface DeveloperListResponse {
  items: DeveloperItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  summary?: DeveloperListSummary;
}
