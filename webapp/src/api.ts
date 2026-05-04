import { getInitData } from "./telegram";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export interface User {
  id: number;
  tz: string;
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

// -------------------- Game types --------------------

export interface GamePet {
  id: number;
  character_type: string;
  rarity: string;
  name: string | null;
  xp: number;
  stage: number;
  stage_name_ru: string;
  stage_name_en: string;
  xp_for_next: number;
  xp_current_stage: number;
  accessory_slug: string | null;
  hatched_at: string;
}

export interface GameProfile {
  coins: number;
  total_coins_earned: number;
  streak_days: number;
  last_streak_date: string | null;
  perfect_days_count: number;
  tasks_completed_total: number;
  daily_coins_earned: number;
  daily_cap: number;
  active_pet: GamePet | null;
  active_background_slug: string | null;
  today_tasks_done: number;
  today_tasks_total: number;
  has_pet: boolean;
}

export interface HatchResponse {
  pet: GamePet;
  character_name_ru: string;
  character_name_en: string;
  rarity_name_ru: string;
  rarity_name_en: string;
}

export interface GameItem {
  id: number;
  slug: string;
  name_ru: string;
  name_en: string;
  type: string;
  image_path: string;
  price: number;
  is_premium: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface GameAchievement {
  id: number;
  slug: string;
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  reward_coins: number;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
}

export const api = {
  me: () => request<User>("/api/me"),
  updateMe: (tz: string) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ tz }) }),
  updateMeFields: (fields: { tz?: string; onboarding_completed?: boolean }) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify(fields) }),
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

  // -------------------- Game --------------------
  gameProfile: () => request<GameProfile>("/api/game/profile"),
  gameHatch: (egg_slug: string) =>
    request<HatchResponse>("/api/game/hatch", {
      method: "POST",
      body: JSON.stringify({ egg_slug }),
    }),
  gamePets: () => request<GamePet[]>("/api/game/pets"),
  gameActivatePet: (petId: number) =>
    request<GamePet>(`/api/game/pets/${petId}/activate`, { method: "POST" }),
  gameRenamePet: (petId: number, name: string) =>
    request<GamePet>(`/api/game/pets/${petId}/rename`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  gameShop: () => request<GameItem[]>("/api/game/shop"),
  gameBuy: (item_id: number) =>
    request<GameItem>("/api/game/buy", {
      method: "POST",
      body: JSON.stringify({ item_id }),
    }),
  gameEquip: (pet_id: number, item_id: number | null) =>
    request<GamePet>("/api/game/equip", {
      method: "POST",
      body: JSON.stringify({ pet_id, item_id }),
    }),
  gameSetBackground: (item_id: number | null) =>
    request<GameProfile>("/api/game/set-background", {
      method: "POST",
      body: JSON.stringify({ item_id }),
    }),
  gameAchievements: () => request<GameAchievement[]>("/api/game/achievements"),
};
