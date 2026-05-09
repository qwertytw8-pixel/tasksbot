import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Build trigger: force Vercel rebuild v2
import { api } from "./api";
import type { GameEvent } from "./api";
import { AchievementModal } from "./components/AchievementModal";
import { DailyRewardModal } from "./components/DailyRewardModal";
import { OnboardingTour } from "./components/OnboardingTour";
import { ToastProvider } from "./components/Toast";
import { useI18n } from "./i18n";
import {
  CalendarIcon,
  ListIcon,
  PawIcon,
  PlusIcon,
  SparkIcon,
  UserIcon,
} from "./icons";
import { getUserTimezone } from "./telegram";

const TodayPage = lazy(() => import("./pages/Today").then((m) => ({ default: m.TodayPage })));
const AllPage = lazy(() => import("./pages/All").then((m) => ({ default: m.AllPage })));
const CategoriesPage = lazy(() => import("./pages/Categories").then((m) => ({ default: m.CategoriesPage })));
const TaskFormPage = lazy(() => import("./pages/TaskForm").then((m) => ({ default: m.TaskFormPage })));
const CalendarPage = lazy(() => import("./pages/Calendar").then((m) => ({ default: m.CalendarPage })));
const ProfileRoutes = lazy(() => import("./pages/Profile").then((m) => ({ default: m.ProfileRoutes })));
const AdminPage = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminPage })));
const PetPage = lazy(() => import("./pages/Pet").then((m) => ({ default: m.PetPage })));
const PetHatchPage = lazy(() => import("./pages/PetHatch").then((m) => ({ default: m.PetHatchPage })));
const PetAchievementsPage = lazy(() => import("./pages/PetAchievements").then((m) => ({ default: m.PetAchievementsPage })));
const PetShopPage = lazy(() => import("./pages/PetShop").then((m) => ({ default: m.PetShopPage })));
const PetCollectionPage = lazy(() => import("./pages/PetCollection").then((m) => ({ default: m.PetCollectionPage })));
const DailyQuestsPage = lazy(() => import("./pages/DailyQuests").then((m) => ({ default: m.DailyQuestsPage })));
const LuckySpinPage = lazy(() => import("./pages/LuckySpin").then((m) => ({ default: m.LuckySpinPage })));
const ReferralPage = lazy(() => import("./pages/Referral").then((m) => ({ default: m.ReferralPage })));

const HIDE_FAB_ON = ["/new", "/edit", "/profile", "/about", "/admin", "/pet"];

function PageFallback() {
  const { t } = useI18n();
  return <div className="spinner">{t("loading")}</div>;
}

export function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        const tz = getUserTimezone();
        if (!cancelled && me.tz !== tz && tz && tz !== "UTC") {
          await api.updateMe(tz);
        }
        if (!cancelled && !me.onboarding_completed) {
          setShowOnboarding(true);
        }
        if (!cancelled && me.onboarding_completed) {
          try {
            const reward = await api.dailyRewardStatus();
            if (!cancelled && !reward.claimed_today) {
              setShowDailyReward(true);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore — user will see error in pages
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for game event celebrations from anywhere in the app
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as GameEvent;
      if (detail) setGameEvent(detail);
    };
    document.addEventListener("show-achievement", handler);
    return () => document.removeEventListener("show-achievement", handler);
  }, []);

  // Pet reaction overlay
  const [petReaction, setPetReaction] = useState(false);
  useEffect(() => {
    const handler = () => setPetReaction(true);
    document.addEventListener("show-pet-reaction", handler);
    return () => document.removeEventListener("show-pet-reaction", handler);
  }, []);
  const clearReaction = useCallback(() => setPetReaction(false), []);

  return (
    <ToastProvider>
    <div className="app">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/all" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/all" element={<AllPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/pet" element={<PetPage />} />
          <Route path="/pet/hatch" element={<PetHatchPage />} />
          <Route path="/pet/achievements" element={<PetAchievementsPage />} />
          <Route path="/pet/shop" element={<PetShopPage />} />
          <Route path="/pet/collection" element={<PetCollectionPage />} />
          <Route path="/pet/quests" element={<DailyQuestsPage />} />
          <Route path="/pet/spin" element={<LuckySpinPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/profile/*" element={<ProfileRoutes onResetOnboarding={() => setShowOnboarding(true)} />} />
          <Route path="/about" element={<Navigate to="/profile" replace />} />
          <Route path="/admin" element={<AdminPage onShowDailyReward={() => setShowDailyReward(true)} />} />
          <Route path="/new" element={<TaskFormPage />} />
          <Route path="/edit/:id" element={<TaskFormPage />} />
        </Routes>
      </Suspense>
      <Fab />
      <TabBar />
      {showDailyReward && (
        <DailyRewardModal onClose={() => setShowDailyReward(false)} />
      )}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
      {gameEvent && (
        <AchievementModal
          gameEvent={gameEvent}
          onClose={() => setGameEvent(null)}
        />
      )}
      {petReaction && <PetReactionOverlay onDone={clearReaction} />}
    </div>
    </ToastProvider>
  );
}

function Fab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  if (HIDE_FAB_ON.some((p) => location.pathname.startsWith(p))) return null;
  return (
    <button className="fab" aria-label={t("fab.label")} onClick={() => navigate("/new")}>
      <PlusIcon />
    </button>
  );
}

const PET_EMOJIS = ["\u{1F389}", "\u{2B50}", "\u{1F31F}", "\u{1F525}", "\u{1F4AA}", "\u{1F60D}", "\u{1F973}"];

function PetReactionOverlay({ onDone }: { onDone: () => void }) {
  const emoji = PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)];
  useEffect(() => {
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="pet-reaction-overlay">
      <span className="pet-reaction">{emoji}</span>
    </div>
  );
}

function TabBar() {
  const { t } = useI18n();
  const tabs = [
    { to: "/all", label: t("tab.all"), icon: ListIcon },
    { to: "/pet", label: t("tab.pet"), icon: PawIcon },
    { to: "/today", label: t("tab.today"), icon: SparkIcon },
    { to: "/calendar", label: t("tab.calendar"), icon: CalendarIcon },
    { to: "/profile", label: t("tab.profile"), icon: UserIcon },
  ];

  return (
    <nav className="tabbar tabbar--five">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab ${isActive ? "tab--active" : ""}`}
          >
            <Icon className="tab__icon" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
