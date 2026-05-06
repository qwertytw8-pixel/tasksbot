import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Build trigger: force Vercel rebuild v2
import { api } from "./api";
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

const HIDE_FAB_ON = ["/new", "/edit", "/profile", "/about", "/admin", "/pet"];

function PageFallback() {
  const { t } = useI18n();
  return <div className="spinner">{t("loading")}</div>;
}

export function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);

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
