import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { api } from "./api";
import {
  CalendarIcon,
  ListIcon,
  PlusIcon,
  SparkIcon,
  TagIcon,
  UserIcon,
} from "./icons";
import { getUserTimezone } from "./telegram";

const TodayPage = lazy(() => import("./pages/Today").then((m) => ({ default: m.TodayPage })));
const AllPage = lazy(() => import("./pages/All").then((m) => ({ default: m.AllPage })));
const CategoriesPage = lazy(() => import("./pages/Categories").then((m) => ({ default: m.CategoriesPage })));
const TaskFormPage = lazy(() => import("./pages/TaskForm").then((m) => ({ default: m.TaskFormPage })));
const CalendarPage = lazy(() => import("./pages/Calendar").then((m) => ({ default: m.CalendarPage })));
const ProfileRoutes = lazy(() => import("./pages/Profile").then((m) => ({ default: m.ProfileRoutes })));

const HIDE_FAB_ON = ["/new", "/edit", "/profile", "/about"];

function PageFallback() {
  return <div className="spinner">Загрузка…</div>;
}

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        const tz = getUserTimezone();
        if (me.tz !== tz && tz && tz !== "UTC") {
          await api.updateMe(tz);
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
    return <PageFallback />;
  }

  return (
    <div className="app">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/all" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/all" element={<AllPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile/*" element={<ProfileRoutes />} />
          <Route path="/about" element={<Navigate to="/profile" replace />} />
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
    { to: "/categories", label: "Категории", icon: TagIcon },
    { to: "/profile", label: "Профиль", icon: UserIcon },
  ];

  return (
    <nav className="tabbar tabbar--five">
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
