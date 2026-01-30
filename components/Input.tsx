"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`bg-white border border-slate-200 focus:border-[#1f4b99] focus:ring-2 focus:ring-[#1f4b99]/20 outline-none p-4 w-full rounded-lg text-slate-900 placeholder:text-slate-400 transition-all duration-200 shadow-sm min-h-[44px] ${className}`}
    />
  );
}
