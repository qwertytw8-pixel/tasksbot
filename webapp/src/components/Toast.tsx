import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "achievement";
  icon?: ReactNode;
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem["type"], icon?: ReactNode) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback(
    (message: string, type: ToastItem["type"] = "success", icon?: ReactNode) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, icon }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            {toast.icon && <span className="toast__icon">{toast.icon}</span>}
            <span className="toast__message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
