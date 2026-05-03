import { lazy, Suspense, useEffect, useState } from "react";
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

const TodayPage = lazy(() => import("./pages/Today").then((m) => ({ default: m.TodayPage })));
const AllPage = lazy(() => import("./pages/All").then((m) => ({ default: m.AllPage })));
const CategoriesPage = lazy(() => import("./pages/Categories").then((m) => ({ default: m.CategoriesPage })));
const TaskFormPage = lazy(() => import("./pages/TaskForm").then((m) => ({ default: m.TaskFormPage })));
const CalendarPage = lazy(() => import("./pages/Calendar").then((m) => ({ default: m.CalendarPage })));
const ProfileRoutes = lazy(() => import("./pages/Profile").then((m) => ({ default: m.ProfileRoutes })));
const AdminPage = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminPage })));

const HIDE_FAB_ON = ["/new", "/edit", "/profile", "/about", "/admin"];

function PageFallback() {
  return <div className="spinner">Загрузка…</div>;
}

export function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      } catch {
        // ignore — user will see error in pages
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/all" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/all" element={<AllPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile/*" element={<ProfileRoutes onResetOnboarding={() => setShowOnboarding(true)} />} />
          <Route path="/about" element={<Navigate to="/profile" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/new" element={<TaskFormPage />} />
          <Route path="/edit/:id" element={<TaskFormPage />} />
        </Routes>
      </Suspense>
      <Fab />
      <TabBar />
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
