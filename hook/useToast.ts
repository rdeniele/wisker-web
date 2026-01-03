"use client";

import { useState, useCallback } from "react";
import { AlertColor } from "@mui/material";

interface ToastState {
    open: boolean;
    message: string;
    severity: AlertColor;
}

interface UseToastReturn {
    toast: ToastState;
    showToast: (message: string, severity: AlertColor) => void;
    hideToast: () => void;
}

export function useToast(): UseToastReturn {
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: "",
        severity: "info",
    });

    const showToast = useCallback((message: string, severity: AlertColor) => {
        setToast({ open: true, message, severity });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, open: false }));
    }, []);

    return { toast, showToast, hideToast };
}
