"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  title?: string;
  ariaLabel?: string;
}

export default function Button({
  children,
  onClick,
  className = "",
  disabled,
  type = "button",
  title,
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={() => {
        if (onClick && !disabled) onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`bg-[#1f4b99] hover:bg-[#163a79] text-white px-4 sm:px-5 py-3 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] touch-manipulation ${className}`}
    >
      {children}
    </button>
  );
}
