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
  due_at: string | null;
  remind_minutes_before: number | null;
  is_done: boolean;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  category_id?: number | null;
  due_at?: string | null;
  remind_minutes_before?: number | null;
  is_done?: boolean;
}

export interface CategoryInput {
  name: string;
  color?: string | null;
  emoji?: string | null;
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

export const api = {
  me: () => request<User>("/api/me"),
  updateMe: (tz: string) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ tz }) }),

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

  listTasks: (done?: boolean) => {
    const qs = done === undefined ? "" : `?done=${done}`;
    return request<Task[]>(`/api/tasks${qs}`);
  },
  createTask: (input: TaskInput) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
  updateTask: (id: number, input: TaskInput) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTask: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};
