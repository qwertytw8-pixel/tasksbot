import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";

import { App } from "./App";
import { initTelegram } from "./telegram";
import "./styles.css";

initTelegram();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoot
        appearance={(window.Telegram?.WebApp?.colorScheme ?? "light") as "light" | "dark"}
      >
        <App />
      </AppRoot>
    </BrowserRouter>
  </React.StrictMode>
);
