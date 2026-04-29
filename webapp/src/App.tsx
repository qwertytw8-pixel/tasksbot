import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";

import { api } from "./api";
import { PlusIcon, SparkIcon, ListIcon, TagIcon } from "./icons";
import { getUserTimezone } from "./telegram";
import { TodayPage } from "./pages/Today";
import { AllPage } from "./pages/All";
import { CategoriesPage } from "./pages/Categories";
import { TaskFormPage } from "./pages/TaskForm";

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
    return <div className="spinner">Загрузка…</div>;
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/all" element={<AllPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/new" element={<TaskFormPage />} />
        <Route path="/edit/:id" element={<TaskFormPage />} />
      </Routes>
      <Fab />
      <TabBar />
    </div>
  );
}

function Fab() {
  const navigate = useNavigate();
  return (
    <button className="fab" aria-label="Новая задача" onClick={() => navigate("/new")}>
      <PlusIcon />
    </button>
  );
}

function TabBar() {
  const tabs = [
    { to: "/today", label: "Сегодня", icon: SparkIcon },
    { to: "/all", label: "Все", icon: ListIcon },
    { to: "/categories", label: "Категории", icon: TagIcon },
  ];

  return (
    <nav className="tabbar">
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
