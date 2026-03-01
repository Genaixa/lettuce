import React from "react";
import clsx from "clsx";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  helper,
  required,
  className,
  id,
  ...props
}: FormInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[#1c3320]/80"
      >
        {label}
        {required && <span className="text-[#c9a84c] ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={clsx(
          "px-3 py-2.5 rounded-lg text-sm transition-colors",
          "bg-white border text-[#1c3320] placeholder:text-[#4a6b52]/40",
          "focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]/30",
          error
            ? "border-red-400 focus:ring-red-400/30"
            : "border-[#c5e0cc] hover:border-[#a8d4b0] focus:border-[#2d6e3e]",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
      {helper && !error && (
        <p className="text-[#1c3320]/40 text-xs mt-0.5">{helper}</p>
      )}
    </div>
  );
}

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function FormTextarea({
  label,
  error,
  helper,
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[#1c3320]/80"
      >
        {label}
        {required && <span className="text-[#c9a84c] ml-1">*</span>}
      </label>
      <textarea
        id={inputId}
        className={clsx(
          "px-3 py-2.5 rounded-lg text-sm resize-y transition-colors",
          "bg-white border text-[#1c3320] placeholder:text-[#4a6b52]/40",
          "focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]/30",
          error
            ? "border-red-400 focus:ring-red-400/30"
            : "border-[#c5e0cc] hover:border-[#a8d4b0] focus:border-[#2d6e3e]",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
      {helper && !error && (
        <p className="text-[#1c3320]/40 text-xs mt-0.5">{helper}</p>
      )}
    </div>
  );
}
