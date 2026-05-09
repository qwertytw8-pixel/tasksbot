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

export interface AchievementEvent {
  slug: string;
  name_ru: string;
  name_en: string;
  icon: string;
  reward_coins: number;
}

export interface GameEvent {
  coins_earned: number;
  xp_earned: number;
  streak_days: number;
  streak_lost: boolean;
  streak_lost_previous: number;
  new_stage: number | null;
  stage_name_ru: string | null;
  stage_name_en: string | null;
  perfect_day: boolean;
  achievements_unlocked: AchievementEvent[];
  daily_cap_reached: boolean;
  combo_count: number;
  combo_multiplier: number;
}

export interface GameReportOut {
  period: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_created: number;
  tasks_on_time: number;
  tasks_high_priority: number;
  current_streak: number;
  total_coins: number;
  perfect_days_total: number;
  tasks_completed_total: number;
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
  game_event?: GameEvent | null;
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
  combo_count: number;
  combo_multiplier: number;
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

export interface FuseResponse {
  pet: GamePet;
  character_name_ru: string;
  character_name_en: string;
  rarity_name_ru: string;
  rarity_name_en: string;
  fused_count: number;
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
  tier: string;
  is_secret: boolean;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
}

export interface DailyQuestOut {
  id: number;
  quest_slug: string;
  description_ru: string;
  description_en: string;
  target_value: number;
  progress: number;
  reward_coins: number;
  is_completed: boolean;
}

export interface DailyQuestsResponse {
  quests: DailyQuestOut[];
  reroll_available: boolean;
  reroll_cost: number;
}

export interface RerollQuestResponse {
  new_quest: DailyQuestOut;
  coins_remaining: number;
}

export interface SpinReward {
  reward_type: string;
  amount: number;
  label_ru: string;
  label_en: string;
}

export interface SpinResponse {
  reward: SpinReward;
  coins_after: number;
  can_spin_again: boolean;
}

export interface DailyRewardStatus {
  current_day: number;
  claimed_today: boolean;
  rewards: number[];
}

export interface DailyRewardClaim {
  coins_earned: number;
  current_day: number;
  next_reward: number | null;
}

export const api = {
  me: () => request<User>("/api/me"),
  updateMe: (tz: string) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ tz }) }),
  updateMeFields: (fields: { tz?: string; onboarding_completed?: boolean }) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify(fields) }),
  completeOnboarding: () =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ onboarding_completed: true }) }),
  resetOnboarding: () =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify({ onboarding_completed: false }) }),
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
  gameDeletePet: (petId: number) =>
    request<{ deleted: boolean; message: string }>(`/api/game/pets/${petId}`, { method: "DELETE" }),
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
  gameReport: (period: string) =>
    request<GameReportOut>(`/api/game/report?period=${period}`),
  dailyRewardStatus: () =>
    request<DailyRewardStatus>("/api/game/daily-reward"),
  claimDailyReward: () =>
    request<DailyRewardClaim>("/api/game/daily-reward", { method: "POST" }),
  dailyQuests: () =>
    request<DailyQuestsResponse>("/api/game/quests"),
  rerollQuest: (questId: number) =>
    request<RerollQuestResponse>(`/api/game/quests/${questId}/reroll`, { method: "POST" }),
  gameFuse: (pet_ids: number[]) =>
    request<FuseResponse>("/api/game/fuse", {
      method: "POST",
      body: JSON.stringify({ pet_ids }),
    }),
  luckySpin: () =>
    request<SpinResponse>("/api/game/spin", { method: "POST" }),

  // -------------------- Subscription & Admin --------------------
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
  adminGrantCoins: (userId: number, coins: number) =>
    request<{ success: boolean; message: string; new_balance: number }>(
      "/api/admin/grant-coins",
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId, coins }),
      },
    ),

  adminTestNotification: () =>
    request<{ success: boolean; message: string }>(
      "/api/admin/test-notification",
      { method: "POST" },
    ),

  botInfo: () => request<{ bot_username: string }>("/api/bot-info"),

  createInvoice: (plan: string) =>
    request<{ invoice_url: string }>("/api/subscription/create-invoice", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),
};

export function showAchievementModal(gameEvent: GameEvent) {
  document.dispatchEvent(new CustomEvent("show-achievement", { detail: gameEvent }));
}

export function showPetReaction() {
  document.dispatchEvent(new CustomEvent("show-pet-reaction"));
}

export async function toggleTask(task: Task): Promise<Task> {
  const updated = await api.updateTask(task.id, {
    title: task.title,
    description: task.description,
    category_id: task.category_id,
    parent_task_id: task.parent_task_id,
    due_date: task.due_date,
    has_time: task.has_time,
    due_at: task.due_at,
    remind_minutes_before: task.remind_minutes_before,
    recurrence: task.recurrence,
    priority: task.priority,
    is_done: !task.is_done,
  });
  if (updated.game_event) {
    showAchievementModal(updated.game_event);
    if (!task.is_done && updated.game_event.coins_earned > 0) {
      showPetReaction();
    }
  }
  return updated;
}
