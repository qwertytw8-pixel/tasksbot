import { getInitData } from "./telegram";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export interface User {
  id: number;
  tz: string;
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
};
