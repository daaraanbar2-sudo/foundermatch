import { T, F } from "./theme.js";

export function Btn({ children, onClick, disabled, ghost, small, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: ghost ? "none" : disabled ? T.border : T.accent,
        color: ghost ? T.text : disabled ? T.muted : "#0e0d0a",
        border: ghost ? `1px solid ${T.border}` : "none",
        padding: small ? "7px 14px" : "11px 20px",
        fontSize: small ? 12 : 14,
        fontWeight: 600,
        borderRadius: 5,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: F.body,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, onKeyDown, style = {} }) {
  return (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={{
        background: T.panel2,
        border: `1px solid ${T.border}`,
        color: T.text,
        padding: "11px 14px",
        borderRadius: 5,
        fontSize: 14,
        fontFamily: F.body,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

export function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.accent,
        marginBottom: 12,
        fontFamily: F.body,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 0", color: T.muted, fontFamily: F.body, fontSize: 13 }}>
      <div
        style={{
          width: 26,
          height: 26,
          border: `2px solid ${T.border}`,
          borderTopColor: T.accent,
          borderRadius: "50%",
          animation: "chess-spin 0.8s linear infinite",
        }}
      />
      {label}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div
      style={{
        background: "rgba(224,96,90,0.1)",
        border: `1px solid ${T.danger}`,
        color: T.danger,
        padding: "10px 14px",
        borderRadius: 5,
        fontSize: 13,
        fontFamily: F.body,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, color }) {
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: "0.05em",
        padding: "3px 9px",
        borderRadius: 20,
        border: `1px solid ${color || T.border}`,
        color: color || T.muted,
        fontFamily: F.body,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
