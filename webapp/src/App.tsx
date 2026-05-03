import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { api } from "./api";
import { OnboardingTour } from "./components/OnboardingTour";
import {
  CalendarIcon,
  ListIcon,
  PlusIcon,
  SparkIcon,
  UserIcon,
} from "./icons";
import { getUserTimezone } from "./telegram";
import { TodayPage } from "./pages/Today";
import { AllPage } from "./pages/All";
import { CategoriesPage } from "./pages/Categories";
import { TaskFormPage } from "./pages/TaskForm";
import { CalendarPage } from "./pages/Calendar";
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
    { to: "/all", label: "Все", icon: ListIcon },
    { to: "/today", label: "Сегодня", icon: SparkIcon },
    { to: "/calendar", label: "Календарь", icon: CalendarIcon },
    { to: "/profile", label: "Профиль", icon: UserIcon },
  ];

  return (
    <nav className="tabbar tabbar--four">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => `tab ${isActive ? "tab--active" : ""}`}
          >
            <Icon className="tab__icon" />
            <span>{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
