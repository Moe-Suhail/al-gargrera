/* eslint-disable @next/next/no-img-element */
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileAvatar({
  imageUrl,
  name,
  size = "md"
}: {
  imageUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  }[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ?? "الملف الشخصي"}
        className={cn(
          sizeClass,
          "rounded-lg border border-line bg-white object-cover"
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        sizeClass,
        "inline-flex items-center justify-center rounded-lg border border-line bg-limeSoft text-leaf"
      )}
      aria-label={name ?? "الملف الشخصي"}
    >
      <UserRound className={size === "lg" ? "h-10 w-10" : "h-5 w-5"} />
    </span>
  );
}
