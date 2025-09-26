import { CSSProperties } from "react";

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

const fullScreenStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(4px)",
  background: "rgba(24, 24, 27, 0.55)",
  zIndex: 999,
};

const inlineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
};

export function LoadingOverlay({
  message = "로딩 중...",
  fullScreen = false,
}: LoadingOverlayProps): JSX.Element {
  return (
    <div style={fullScreen ? fullScreenStyle : inlineStyle} aria-live="polite" aria-busy>
      <div className="spinner" />
      <span style={{ marginLeft: "0.75rem", fontWeight: 500 }}>{message}</span>
    </div>
  );
}
