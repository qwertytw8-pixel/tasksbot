import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { api } from "./api";
import { OnboardingTour } from "./components/OnboardingTour";
import {
  CalendarIcon,
  ListIcon,
  PawIcon,
  PlusIcon,
  SparkIcon,
  UserIcon,
} from "./icons";
import { getUserTimezone } from "./telegram";
import { t } from "./useLocale";
import { TodayPage } from "./pages/Today";
import { AllPage } from "./pages/All";
import { CategoriesPage } from "./pages/Categories";
import { TaskFormPage } from "./pages/TaskForm";
import { CalendarPage } from "./pages/Calendar";
import { PetPage } from "./pages/Pet";
import { PetHatchPage } from "./pages/PetHatch";
import { PetAchievementsPage } from "./pages/PetAchievements";
import { PetShopPage } from "./pages/PetShop";
import { PetCollectionPage } from "./pages/PetCollection";
import { ProfileRoutes } from "./pages/Profile";

const HIDE_FAB_ON = ["/new", "/edit", "/profile", "/about"];

export function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        const tz = getUserTimezone();
        if (me.tz !== tz && tz && tz !== "UTC") {
          await api.updateMe(tz);
        }
        if (!cancelled && !me.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch {
        // ignore — user will see error in pages
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="spinner">Загрузка…</div>;
  }

  return (
    <div className="app">
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
        <Route path="/new" element={<TaskFormPage />} />
        <Route path="/edit/:id" element={<TaskFormPage />} />
      </Routes>
      <Fab />
      <TabBar />
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

function Fab() {
  const navigate = useNavigate();
  const location = useLocation();
  if (HIDE_FAB_ON.some((p) => location.pathname.startsWith(p))) return null;
  return (
    <button className="fab" aria-label="Новая задача" onClick={() => navigate("/new")}>
      <PlusIcon />
    </button>
  );
}

function TabBar() {
  const tabs = [
    { to: "/all", label: t("Все", "All"), icon: ListIcon },
    { to: "/pet", label: t("Питомец", "Pet"), icon: PawIcon },
    { to: "/today", label: t("Сегодня", "Today"), icon: SparkIcon },
    { to: "/calendar", label: t("Календарь", "Calendar"), icon: CalendarIcon },
    { to: "/profile", label: t("Профиль", "Profile"), icon: UserIcon },
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
