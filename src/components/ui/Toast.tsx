"use client";

import { Snackbar, Alert, AlertColor } from "@mui/material";

export interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor; // "success" | "error" | "warning" | "info"
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  open,
  message,
  severity,
  onClose,
  duration = 5000,
}: ToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
