"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  confirmMessage?: string;
};

export function SubmitButton({
  children,
  className,
  confirmMessage,
  disabled,
  onClick,
  pendingLabel = "جاري الحفظ...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (confirmMessage && !pending && !window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return (
    <button
      {...props}
      aria-busy={pending}
      className={cn(
        "disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      disabled={disabled || pending}
      onClick={handleClick}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
