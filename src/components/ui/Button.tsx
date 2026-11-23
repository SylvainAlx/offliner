interface ButtonProps {
  children: React.ReactNode;
  color?: string;
  disabled?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick: () => void;
}

export default function Button({
  children,
  color = "var(--accent-solid)",
  onClick,
  disabled = false,
  ariaLabel,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      className={`min-h-11 px-3.5 py-2.5 border-0 rounded-[10px] text-(--on-color) cursor-pointer text-[0.9rem] font-bold transition-all duration-300 ease-out hover:shadow-[0_13px_24px_rgba(17,24,39,0.25)] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:translate-y-0 ${className}`.trim()}
      style={{ background: color }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      type={type}
    >
      {children}
    </button>
  );
}
