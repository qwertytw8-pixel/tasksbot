import { getInitData } from "./telegram";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export interface User {
  id: number;
  tz: string;
  is_admin: boolean;
  onboarding_completed: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string | null;
  emoji: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  parent_task_id: number | null;
  due_date: string | null;
  has_time: boolean;
  due_at: string | null;
  remind_minutes_before: number | null;
  recurrence: string | null;
  priority: number;
  is_done: boolean;
  done_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  category_id?: number | null;
  parent_task_id?: number | null;
  due_date?: string | null;
  has_time?: boolean;
  due_at?: string | null;
  remind_minutes_before?: number | null;
  recurrence?: string | null;
  priority?: number;
  is_done?: boolean;
}

export interface CategoryInput {
  name: string;
  color?: string | null;
  emoji?: string | null;
}

export interface PrivacyInfo {
  support_label: string;
  support_text: string;
  privacy_summary: string;
}

export interface SubscriptionOut {
  id: number;
  plan: string;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  source: string;
}

export interface SubscriptionStatus {
  is_premium: boolean;
  subscription: SubscriptionOut | null;
  active_tasks_count: number;
  max_tasks: number;
  daily_tasks_count: number;
  max_daily_tasks: number;
  can_create_categories: boolean;
}

export interface PlanInfo {
  name: string;
  price_stars: number;
  features: string[];
}

export interface PlansOut {
  free: PlanInfo;
  premium: PlanInfo;
}

export interface PromoActivateOut {
  success: boolean;
  message: string;
  expires_at: string | null;
}

export interface PromoCodeOut {
  id: number;
  code: string;
  duration_days: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminStatsOut {
  total_users: number;
  premium_users: number;
  total_tasks: number;
  total_promo_codes: number;
  total_promo_activations: number;
}

export interface AdminUserOut {
  id: number;
  tz: string;
  is_admin: boolean;
  created_at: string;
  is_premium: boolean;
  subscription_expires: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `tma ${getInitData()}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${txt || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface ListTasksParams {
  done?: boolean;
  day?: string;
  parentId?: number | null;
  topLevel?: boolean;
  archived?: boolean;
}

function buildTaskQuery(params?: ListTasksParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.done !== undefined) qs.set("done", String(params.done));
  if (params.day !== undefined) qs.set("day", params.day);
  if (params.parentId !== undefined && params.parentId !== null) {
    qs.set("parent_id", String(params.parentId));
  }
  if (params.topLevel) qs.set("top_level", "true");
  if (params.archived !== undefined) qs.set("archived", String(params.archived));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const api = {
  me: () => request<User>("/api/me"),
  updateMe: (tz: string) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ tz }) }),
  completeOnboarding: () =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ onboarding_completed: true }) }),
  privacy: () => request<PrivacyInfo>("/api/privacy"),

  listCategories: () => request<Category[]>("/api/categories"),
  createCategory: (input: CategoryInput) =>
    request<Category>("/api/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id: number, input: CategoryInput) =>
    request<Category>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteCategory: (id: number) =>
    request<void>(`/api/categories/${id}`, { method: "DELETE" }),

  listTasks: (params?: ListTasksParams) =>
    request<Task[]>(`/api/tasks${buildTaskQuery(params)}`),
  createTask: (input: TaskInput) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
  updateTask: (id: number, input: TaskInput) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTask: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  archiveTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/archive`, { method: "POST" }),
  unarchiveTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/unarchive`, { method: "POST" }),

  subscriptionStatus: () =>
    request<SubscriptionStatus>("/api/subscription/status"),
  subscriptionPlans: () => request<PlansOut>("/api/subscription/plans"),
  activatePromo: (code: string) =>
    request<PromoActivateOut>("/api/subscription/activate-promo", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  adminStats: () => request<AdminStatsOut>("/api/admin/stats"),
  adminUsers: (premiumOnly?: boolean) =>
    request<AdminUserOut[]>(
      `/api/admin/users${premiumOnly ? "?premium_only=true" : ""}`,
    ),
  adminPromos: () => request<PromoCodeOut[]>("/api/admin/promos"),
  adminCreatePromo: (code: string, durationDays: number, maxUses: number) =>
    request<PromoCodeOut>("/api/admin/promos", {
      method: "POST",
      body: JSON.stringify({
        code,
        duration_days: durationDays,
        max_uses: maxUses,
      }),
    }),
  adminDeletePromo: (id: number) =>
    request<void>(`/api/admin/promos/${id}`, { method: "DELETE" }),
  adminGrant: (userId: number, durationDays: number | null) =>
    request<{ success: boolean; message: string }>("/api/admin/grant", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        duration_days: durationDays,
      }),
    }),

  botInfo: () => request<{ bot_username: string }>("/api/bot-info"),

  createInvoice: (plan: string) =>
    request<{ invoice_url: string }>("/api/subscription/create-invoice", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),
};
