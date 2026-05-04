/**
 * Lightweight locale hook.
 * Detects language from Telegram WebApp initDataUnsafe or navigator.
 * Returns 'ru' for Russian-speaking users, 'en' otherwise.
 */

export type Locale = "ru" | "en";

export function getLocale(): Locale {
  try {
    const raw = window.Telegram?.WebApp?.initData ?? "";
    if (raw) {
      const params = new URLSearchParams(raw);
      const userJson = params.get("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.language_code?.startsWith("ru")) return "ru";
        if (user.language_code) return "en";
      }
    }
  } catch {
    /* ignore */
  }

  const nav = navigator.language ?? "";
  if (nav.startsWith("ru")) return "ru";
  return "en";
}

const _locale = getLocale();

export function useLocale(): Locale {
  return _locale;
}

/** Pick a value by locale */
export function t<T>(ru: T, en: T): T {
  return _locale === "ru" ? ru : en;
}
