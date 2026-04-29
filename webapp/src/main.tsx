import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";

import { App } from "./App";
import { initTelegram } from "./telegram";
import { applyTheme, getStoredMode } from "./theme";
import "./styles.css";

initTelegram();
const initialResolved = applyTheme(getStoredMode());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoot appearance={initialResolved}>
        <App />
      </AppRoot>
    </BrowserRouter>
  </React.StrictMode>
);
