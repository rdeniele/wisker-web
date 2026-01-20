"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "@/components/ui/Toast";
import { AlertColor } from "@mui/material";

interface ToastContextType {
  showToast: (message: string, type: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: AlertColor;
    isOpen: boolean;
  }>({
    message: "",
    type: "info",
    isOpen: false,
  });

  const showToast = useCallback((message: string, type: AlertColor) => {
    setToast({ message, type, isOpen: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        open={toast.isOpen}
        message={toast.message}
        severity={toast.type}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
