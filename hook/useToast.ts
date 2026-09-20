"use client";

import { useState, useCallback } from "react";
import type { ToastSeverity } from "@/components/ui/Toast";

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

interface UseToastReturn {
  toast: ToastState;
  showToast: (message: string, severity: ToastSeverity) => void;
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = useCallback((message: string, severity: ToastSeverity) => {
    setToast({ open: true, message, severity });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return { toast, showToast, hideToast };
}
