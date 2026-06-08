"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ImageUp, UserRound } from "lucide-react";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProfileImagePicker({
  imageUrl,
  name
}: {
  imageUrl?: string | null;
  name?: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const activeUrl = previewUrl || imageUrl || "";
  const initials = useMemo(() => {
    const cleaned = name?.trim();
    return cleaned ? cleaned.slice(0, 1) : "";
  }, [name]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="rounded-lg border border-white/75 bg-white/55 p-4 shadow-sm ring-1 ring-white/65 backdrop-blur-2xl">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-coin/30 bg-gradient-to-br from-limeSoft to-white shadow-card">
          {activeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeUrl}
              alt={name ?? "الصورة الشخصية"}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-leaf">
              {initials ? (
                <span className="text-3xl font-black">{initials}</span>
              ) : (
                <UserRound className="h-10 w-10" />
              )}
            </div>
          )}
          <span className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-leaf text-white shadow-soft">
            <Camera className="h-4 w-4" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">الصورة الشخصية</p>
          <p className="mt-1 text-xs leading-5 text-sage">
            اختر صورة، وستظهر كاملة قبل الحفظ بدون قص تلقائي. الحد الأقصى 3 ميجابايت.
          </p>
          {error ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50/85 px-2 py-1 text-xs font-bold text-red-700">
              {error}
            </p>
          ) : null}
          {fileName ? (
            <p className="mt-2 truncate text-xs font-bold text-leaf">
              جاهزة للحفظ: {fileName}
            </p>
          ) : null}
        </div>
      </div>

      <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-leaf/25 bg-limeSoft/70 px-4 py-2 text-sm font-black text-leaf transition hover:bg-limeSoft">
        <ImageUp className="h-4 w-4" />
        اختيار صورة
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          name="profile_image"
          type="file"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (!file) {
              setFileName("");
              setPreviewUrl(null);
              setError("");
              return;
            }

            if (!ALLOWED_TYPES.has(file.type)) {
              event.currentTarget.value = "";
              setFileName("");
              setPreviewUrl(null);
              setError("استخدم JPG أو PNG أو WebP فقط.");
              return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
              event.currentTarget.value = "";
              setFileName("");
              setPreviewUrl(null);
              setError("الصورة كبيرة. اختر صورة لا تتجاوز 3 ميجابايت.");
              return;
            }

            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }

            setError("");
            setFileName(file.name);
            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
      </label>
    </div>
  );
}
