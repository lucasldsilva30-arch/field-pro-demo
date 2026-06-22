"use client";

import { useRef } from "react";
import { fromDateInputValue, toDateInputValue } from "@/lib/date";

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function DatePickerField({ label, value, onChange, placeholder, className = "" }: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  }

  return (
    <label className={`block ${className}`}>
      {label ? <span className="text-sm font-semibold text-slate-300">{label}</span> : null}
      <input
        ref={inputRef}
        className={`mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60 ${label ? "" : "mt-0"}`}
        onChange={(event) => onChange(fromDateInputValue(event.target.value))}
        onClick={openPicker}
        placeholder={placeholder ?? "Selecionar data"}
        type="date"
        value={toDateInputValue(value)}
      />
    </label>
  );
}
