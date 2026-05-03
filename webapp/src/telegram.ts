// Light wrappers around the Telegram WebApp global object.
// We avoid hard dependency on the SDK for these basics — keeps the bundle small.

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; username?: string; language_code?: string } };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready(): void;
  expand(): void;
  close(): void;
  onEvent(event: string, cb: () => void): void;
  HapticFeedback?: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  showAlert?(message: string): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  openInvoice?(url: string, cb?: (status: string) => void): void;
}

export function initTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
  } catch {
    /* ignore */
  }
}

export function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? "";
}

export function getColorScheme(): "light" | "dark" {
  return window.Telegram?.WebApp?.colorScheme ?? "light";
}

export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* ignore */
  }
}

export function getUserLanguage(): "ru" | "en" {
  const code = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code ?? "";
  return code.startsWith("ru") ? "ru" : "en";
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
